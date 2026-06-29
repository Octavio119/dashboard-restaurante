const { resolvePlanAccess, OWNER_RESTAURANTE_ID } = require('../lib/planLimits');
const { hasValidAdminCode } = require('../lib/adminAuth');

const MS_30_DIAS = 30 * 24 * 60 * 60 * 1000;

async function checkOrderLimit(req, res, next) {
  try {
    const prisma = req.prisma;
    const rid    = req.user?.restaurante_id;
    if (!rid) return res.status(401).json({ error: 'No autorizado' });

    const restaurante = await prisma.restaurante.findUnique({
      where:  { id: rid },
      select: { plan: true, plan_status: true, trial_ends_at: true, ordenes_mes_actual: true, billing_ciclo_inicio: true },
    });
    if (!restaurante) return res.status(404).json({ error: 'Restaurante no encontrado' });

    const plan_status = restaurante.plan_status || 'active';
    const bypassed     = rid === OWNER_RESTAURANTE_ID || hasValidAdminCode(req);
    if (!bypassed && (plan_status === 'past_due' || plan_status === 'cancelled')) {
      return res.status(402).json({
        error:       'PAYMENT_REQUIRED',
        plan_status,
        message:     plan_status === 'past_due'
          ? 'Tu suscripción tiene un pago vencido.'
          : 'Tu suscripción fue cancelada.',
        upgrade_url: '/billing',
      });
    }

    const access = resolvePlanAccess({ ...restaurante, id: rid }, { adminBypass: hasValidAdminCode(req) });
    if (access.blocked) {
      return res.status(403).json({ error: access.error, message: access.message, upgrade_url: '/billing' });
    }
    const { limits } = access;

    if (limits.ordenes_mes === Infinity) return next();

    // Reset lazy si pasaron 30 días desde el inicio del ciclo
    const ahora       = new Date();
    const cicloInicio = new Date(restaurante.billing_ciclo_inicio);
    let   ordenesMes  = restaurante.ordenes_mes_actual;

    if (ahora - cicloInicio > MS_30_DIAS) {
      await prisma.restaurante.update({
        where: { id: rid },
        data:  { ordenes_mes_actual: 0, billing_ciclo_inicio: ahora },
      });
      ordenesMes = 0;
    }

    if (ordenesMes >= limits.ordenes_mes) {
      return res.status(429).json({
        error:       'ORDER_LIMIT_REACHED',
        used:        ordenesMes,
        limit:       limits.ordenes_mes,
        plan_actual: restaurante.plan,
        upgrade_url: '/billing',
      });
    }

    next();
  } catch (e) {
    next(e);
  }
}

async function checkUserLimit(req, res, next) {
  try {
    const prisma = req.prisma;
    const rid    = req.user?.restaurante_id;
    if (!rid) return res.status(401).json({ error: 'No autorizado' });

    const restaurante = await prisma.restaurante.findUnique({
      where:  { id: rid },
      select: { plan: true, trial_ends_at: true },
    });
    if (!restaurante) return res.status(404).json({ error: 'Restaurante no encontrado' });

    const access = resolvePlanAccess({ ...restaurante, id: rid }, { adminBypass: hasValidAdminCode(req) });
    if (access.blocked) {
      return res.status(403).json({ error: access.error, message: access.message, upgrade_url: '/billing' });
    }
    const { limits } = access;

    if (limits.usuarios_max === Infinity) return next();

    const count = await prisma.usuario.count({
      where: { restaurante_id: rid, activo: true },
    });

    if (count >= limits.usuarios_max) {
      return res.status(403).json({
        error:       'limite_alcanzado',
        mensaje:     `Has alcanzado el límite de ${limits.usuarios_max} usuarios del plan ${restaurante.plan}.`,
        plan_actual: restaurante.plan,
        upgrade_url: '/billing',
      });
    }

    next();
  } catch (e) {
    next(e);
  }
}

async function incrementarOrden(prisma, restaurante_id) {
  await prisma.restaurante.update({
    where: { id: restaurante_id },
    data:  { ordenes_mes_actual: { increment: 1 } },
  });
}

module.exports = { checkOrderLimit, checkUserLimit, incrementarOrden };
