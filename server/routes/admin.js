'use strict';
const router = require('express').Router();
const logger = require('../lib/logger');
const { hasValidAdminCode } = require('../lib/adminAuth');

function requireAdminCode(req, res, next) {
  if (!process.env.ADMIN_CODE) return res.status(503).json({ error: 'Panel de administrador no configurado' });
  if (!hasValidAdminCode(req)) return res.status(401).json({ error: 'Código de administrador inválido' });
  next();
}

router.use(requireAdminCode);

const VALID_PLANS = ['trial', 'pro', 'business', 'cancelled'];

// GET /api/admin/restaurantes — lista todos los tenants para soporte/ventas manuales.
// req.prisma no tiene restaurante_id en contexto (no pasó por requireAuth), así
// que la extensión multi-tenant de lib/prisma.js no filtra nada acá — a propósito.
router.get('/restaurantes', async (req, res) => {
  try {
    const restaurantes = await req.prisma.restaurante.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id:            true,
        nombre:        true,
        plan:          true,
        trial_ends_at: true,
        created_at:    true,
        usuarios: {
          where:   { rol: { in: ['admin', 'super_admin'] } },
          orderBy: { created_at: 'asc' },
          take:    1,
          select:  { email: true },
        },
        // No existe un campo de "último acceso" (ni login, ni actividad) en
        // el schema — se usa el pedido más reciente como proxy de actividad.
        pedidos: {
          orderBy: { created_at: 'desc' },
          take:    1,
          select:  { created_at: true },
        },
        _count: { select: { pedidos: true } },
      },
    });

    res.json(restaurantes.map((r) => ({
      id:               r.id,
      nombre:           r.nombre,
      email_admin:      r.usuarios[0]?.email || null,
      plan:             r.plan,
      trial_ends_at:    r.trial_ends_at,
      created_at:       r.created_at,
      pedidos_totales:  r._count.pedidos,
      ultima_actividad: r.pedidos[0]?.created_at || null,
    })));
  } catch (e) {
    logger.error({ err: e }, 'admin: error listando restaurantes');
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/admin/restaurantes/:id/plan — cambio manual de plan (activación por transferencia, soporte, etc.)
router.post('/restaurantes/:id/plan', async (req, res) => {
  const id   = parseInt(req.params.id, 10);
  const { plan } = req.body;

  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });
  if (!VALID_PLANS.includes(plan)) {
    return res.status(400).json({ error: `Plan inválido. Valores permitidos: ${VALID_PLANS.join(', ')}` });
  }

  try {
    const data = { plan };
    if (plan === 'pro' || plan === 'business') data.trial_ends_at = null;

    const restaurante = await req.prisma.restaurante.update({
      where:  { id },
      data,
      select: { id: true, nombre: true, plan: true, trial_ends_at: true },
    });

    logger.info({ id, plan }, 'admin: plan actualizado manualmente');
    res.json({ ok: true, restaurante });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Restaurante no encontrado' });
    logger.error({ err: e }, 'admin: error actualizando plan');
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
