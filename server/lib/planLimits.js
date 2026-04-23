const PLAN_LIMITS = {
  free: {
    ordenes_mes:      50,
    usuarios_max:     2,
    locales_max:      1,
    websocket:        false,
    analytics:        false,
    alertas_email:    false,
    pdf:              false,
    api_keys:         false,
    multi_local:      false,
  },
  pro: {
    ordenes_mes:      Infinity,
    usuarios_max:     Infinity,
    locales_max:      1,
    websocket:        true,
    analytics:        true,
    alertas_email:    true,
    pdf:              true,
    api_keys:         false,
    multi_local:      false,
  },
  business: {
    ordenes_mes:      Infinity,
    usuarios_max:     Infinity,
    locales_max:      5,
    websocket:        true,
    analytics:        true,
    alertas_email:    true,
    pdf:              true,
    api_keys:         true,
    multi_local:      true,
  },
};

const PLAN_REQUERIDO = {
  websocket:     'pro',
  analytics:     'pro',
  alertas_email: 'pro',
  pdf:           'pro',
  api_keys:      'business',
  multi_local:   'business',
};

function checkPlanFeature(featureKey) {
  return async (req, res, next) => {
    try {
      const prisma = req.prisma;
      const rid    = req.user?.restaurante_id;
      if (!rid) return res.status(401).json({ error: 'No autorizado' });

      const restaurante = await prisma.restaurante.findUnique({
        where:  { id: rid },
        select: { plan: true },
      });
      if (!restaurante) return res.status(404).json({ error: 'Restaurante no encontrado' });

      const plan   = restaurante.plan || 'free';
      const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

      if (!limits[featureKey]) {
        const planRequerido = PLAN_REQUERIDO[featureKey] || 'pro';
        return res.status(403).json({
          error:          'plan_required',
          feature:        featureKey,
          plan_actual:    plan,
          plan_requerido: planRequerido,
          upgrade_url:    '/billing',
        });
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = { PLAN_LIMITS, checkPlanFeature };
