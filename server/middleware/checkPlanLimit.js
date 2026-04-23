const { PLAN_LIMITS } = require('../lib/planLimits');

const MS_30_DIAS = 30 * 24 * 60 * 60 * 1000;

async function checkOrderLimit(req, res, next) {
  try {
    const prisma = req.prisma;
    const rid    = req.user?.restaurante_id;
    if (!rid) return res.status(401).json({ error: 'No autorizado' });

    const restaurante = await prisma.restaurante.findUnique({
      where:  { id: rid },
      select: { plan: true, ordenes_mes_actual: true, billing_ciclo_inicio: true },
    });
    if (!restaurante) return res.status(404).json({ error: 'Restaurante no encontrado' });

    const plan   = restaurante.plan || 'free';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

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
      return res.status(403).json({
        error:       'limite_alcanzado',
        mensaje:     `Has alcanzado el límite de ${limits.ordenes_mes} órdenes/mes del plan ${plan}.`,
        plan_actual: plan,
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
      select: { plan: true },
    });
    if (!restaurante) return res.status(404).json({ error: 'Restaurante no encontrado' });

    const plan    = restaurante.plan || 'free';
    const limits  = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    if (limits.usuarios_max === Infinity) return next();

    const count = await prisma.usuario.count({
      where: { restaurante_id: rid, activo: true },
    });

    if (count >= limits.usuarios_max) {
      return res.status(403).json({
        error:       'limite_alcanzado',
        mensaje:     `Has alcanzado el límite de ${limits.usuarios_max} usuarios del plan ${plan}.`,
        plan_actual: plan,
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
