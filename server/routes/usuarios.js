const logger = require('../lib/logger');
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const requireAuth = require('../middleware/auth');
const verifyRole  = require('../middleware/verifyRole');
const { checkUserLimit } = require('../middleware/checkPlanLimit');

router.use(requireAuth);
router.use(require('../middleware/requireTenant'));

const RID = (req) => req.user.restaurante_id;

// GET /api/usuarios
router.get('/', verifyRole('admin', 'gerente'), async (req, res) => {
  try {
    const rows = await req.prisma.usuario.findMany({
      where: { restaurante_id: RID(req) },
      select: { id: true, nombre: true, email: true, rol: true, activo: true, restaurante_id: true, created_at: true },
      orderBy: { id: 'asc' },
    });
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/usuarios
router.post('/', verifyRole('admin'), checkUserLimit, async (req, res) => {
  try {
    const { nombre, email, password, rol = 'staff' } = req.body;
    if (!nombre || !email || !password)
      return res.status(400).json({ error: 'nombre, email y password requeridos' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Contraseña mínimo 6 caracteres' });

    const rolesValidos = ['admin', 'staff', 'chef', 'gerente'];
    if (!rolesValidos.includes(rol))
      return res.status(400).json({ error: `Rol debe ser: ${rolesValidos.join(', ')}` });

    const emailNorm = email.toLowerCase().trim();
    const exists = await req.prisma.usuario.findUnique({ where: { email: emailNorm } });
    if (exists) return res.status(409).json({ error: 'Email ya registrado' });

    const hash = bcrypt.hashSync(password, 10);
    const user = await req.prisma.usuario.create({
      data: { nombre: nombre.trim(), email: emailNorm, password_hash: hash, rol, restaurante_id: RID(req) },
    });
    res.status(201).json({ id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, restaurante_id: user.restaurante_id, activo: user.activo });
  } catch (e) { logger.error({ err: e }, 'route error'); res.status(500).json({ error: 'Error interno' }); }
});

// PATCH /api/usuarios/:id
router.patch('/:id', verifyRole('admin'), async (req, res) => {
  try {
    const { rol, activo } = req.body;
    const id = parseInt(req.params.id);
    const target = await req.prisma.usuario.findFirst({ where: { id, restaurante_id: RID(req) } });
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });

    const data = {};
    if (rol !== undefined) {
      const rolesValidos = ['admin', 'staff', 'chef', 'gerente'];
      if (!rolesValidos.includes(rol)) return res.status(400).json({ error: `Rol debe ser: ${rolesValidos.join(', ')}` });
      data.rol = rol;
    }
    if (activo !== undefined) data.activo = Boolean(activo);

    await req.prisma.usuario.update({ where: { id }, data });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// DELETE /api/usuarios/:id — desactivar
router.delete('/:id', verifyRole('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user.id) return res.status(400).json({ error: 'No puedes desactivarte a ti mismo' });
    const target = await req.prisma.usuario.findFirst({ where: { id, restaurante_id: RID(req) } });
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });
    await req.prisma.usuario.update({ where: { id }, data: { activo: false } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

module.exports = router;
