const logger = require('../lib/logger');
const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { JWT_SECRET, JWT_EXPIRES, JWT_REFRESH_EXPIRES } = require('../config');
const requireAuth = require('../middleware/auth');
const verifyRole  = require('../middleware/verifyRole');

// ─── Rate limiting: máx 10 intentos/15 min por IP ────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de login. Intenta en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function signAccess(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}
function signRefresh(payload) {
  return jwt.sign({ id: payload.id }, JWT_SECRET + '_refresh', { expiresIn: JWT_REFRESH_EXPIRES });
}
async function storeRefreshToken(prisma, userId, token) {
  const key = `refresh:${userId}`;
  await prisma.metadata.upsert({ where: { key }, update: { value: token }, create: { key, value: token } });
}
async function getStoredRefresh(prisma, userId) {
  const row = await prisma.metadata.findUnique({ where: { key: `refresh:${userId}` } });
  return row?.value ?? null;
}
async function clearRefreshToken(prisma, userId) {
  await prisma.metadata.deleteMany({ where: { key: `refresh:${userId}` } });
}

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const user = await req.prisma.usuario.findFirst({
      where: { email: email.toLowerCase().trim(), activo: true },
    });
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const payload = { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, restaurante_id: user.restaurante_id };
    const accessToken  = signAccess(payload);
    const refreshToken = signRefresh(payload);
    await storeRefreshToken(req.prisma, user.id, refreshToken);

    res.json({
      token: accessToken,
      refresh_token: refreshToken,
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, restaurante_id: user.restaurante_id },
    });
  } catch (e) { logger.error({ err: e }, 'route error'); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'refresh_token requerido' });

    let decoded;
    try { decoded = jwt.verify(refresh_token, JWT_SECRET + '_refresh'); }
    catch { return res.status(401).json({ error: 'Refresh token inválido o expirado' }); }

    const stored = await getStoredRefresh(req.prisma, decoded.id);
    if (stored !== refresh_token) return res.status(401).json({ error: 'Refresh token revocado' });

    const user = await req.prisma.usuario.findFirst({ where: { id: decoded.id, activo: true } });
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    const payload = { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, restaurante_id: user.restaurante_id };
    const newAccess  = signAccess(payload);
    const newRefresh = signRefresh(payload);
    await storeRefreshToken(req.prisma, user.id, newRefresh);

    res.json({ token: newAccess, refresh_token: newRefresh });
  } catch (e) { logger.error({ err: e }, 'route error'); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    await clearRefreshToken(req.prisma, req.user.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await req.prisma.usuario.findUnique({
      where: { id: req.user.id },
      include: {
        restaurante: {
          select: { id: true, nombre: true, plan: true }
        }
      }
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res.status(400).json({ error: 'current_password y new_password requeridos' });
    if (new_password.length < 8)
      return res.status(400).json({ error: 'La nueva contraseña debe tener mínimo 8 caracteres' });

    const user = await req.prisma.usuario.findUnique({ where: { id: req.user.id } });
    if (!bcrypt.compareSync(current_password, user.password_hash))
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    const newHash = bcrypt.hashSync(new_password, 12);
    await req.prisma.usuario.update({ where: { id: req.user.id }, data: { password_hash: newHash } });
    await clearRefreshToken(req.prisma, req.user.id); // invalida todas las sesiones
    res.json({ ok: true, message: 'Contraseña actualizada. Por seguridad, vuelve a iniciar sesión.' });
  } catch (e) { logger.error({ err: e }, 'route error'); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/auth/signup — registro público: crea Restaurante + admin en una sola transacción
router.post('/signup', async (req, res) => {
  try {
    const { nombre_restaurante, email, password, nombre_admin } = req.body;
    if (!nombre_restaurante || !email || !password || !nombre_admin)
      return res.status(400).json({ error: 'nombre_restaurante, email, password y nombre_admin son requeridos' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Contraseña mínimo 8 caracteres' });

    const emailNorm = email.toLowerCase().trim();

    // Generar slug único desde el nombre del restaurante
    const baseSlug = nombre_restaurante
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // quitar tildes
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Asegurar unicidad del slug
    const existingSlug = await req.prisma.restaurante.findFirst({ where: { slug: { startsWith: baseSlug } }, orderBy: { id: 'desc' } });
    const slug = existingSlug ? `${baseSlug}-${Date.now()}` : baseSlug;

    const hash = bcrypt.hashSync(password, 12);

    const { restaurante, usuario } = await req.prisma.$transaction(async (tx) => {
      const restaurante = await tx.restaurante.create({
        data: { nombre: nombre_restaurante.trim(), slug, plan: 'free' },
      });
      const usuario = await tx.usuario.create({
        data: { nombre: nombre_admin.trim(), email: emailNorm, password_hash: hash, rol: 'admin', restaurante_id: restaurante.id },
      });
      return { restaurante, usuario };
    });

    const payload     = { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, restaurante_id: restaurante.id };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);
    await storeRefreshToken(req.prisma, usuario.id, refreshToken);

    res.status(201).json({
      token: accessToken,
      refresh_token: refreshToken,
      user: payload,
    });
  } catch (e) {
    // Prisma v5: en transacciones el código P2002 puede venir en e.code o anidado
    const errCode = e.code ?? e.cause?.code ?? e.meta?.cause;
    logger.error({ err: e, errCode, meta: e.meta }, 'signup error');
    if (errCode === 'P2002' || String(e.message).includes('Unique constraint'))
      return res.status(409).json({ error: 'Email o restaurante ya registrado' });
    res.status(500).json({ error: e.message || 'Error interno' });
  }
});

// POST /api/auth/register — solo admin puede crear usuarios
router.post('/register', requireAuth, verifyRole('admin', 'gerente'), async (req, res) => {
  try {
    const { nombre, email, password, rol = 'staff' } = req.body;
    if (!nombre || !email || !password)
      return res.status(400).json({ error: 'Nombre, email y contraseña requeridos' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Contraseña mínimo 8 caracteres' });

    const ROLES_VALIDOS = ['admin', 'gerente', 'chef', 'staff'];
    if (!ROLES_VALIDOS.includes(rol))
      return res.status(400).json({ error: `Rol inválido. Válidos: ${ROLES_VALIDOS.join(', ')}` });

    // Solo admin puede crear otros admins
    if (rol === 'admin' && req.user.rol !== 'admin')
      return res.status(403).json({ error: 'Solo admin puede crear usuarios admin' });

    const emailNorm = email.toLowerCase().trim();
    const exists = await req.prisma.usuario.findUnique({ where: { email: emailNorm } });
    if (exists) return res.status(409).json({ error: 'Email ya registrado' });

    const hash = bcrypt.hashSync(password, 12);
    const user = await req.prisma.usuario.create({
      data: { nombre: nombre.trim(), email: emailNorm, password_hash: hash, rol, restaurante_id: req.user.restaurante_id },
    });

    res.status(201).json({ id: user.id, nombre: user.nombre, email: user.email, rol: user.rol });
  } catch (e) { logger.error({ err: e }, 'route error'); res.status(500).json({ error: 'Error interno' }); }
});

module.exports = router;
