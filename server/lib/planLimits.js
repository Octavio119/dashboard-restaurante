/**
 * Definición canónica de planes — fuente de verdad del backend.
 * Espejo en el frontend: src/config/plans.js (sincronizar a mano si cambian
 * estos valores; no hay un build step que los comparta entre server/ y src/).
 */
const PLAN_LIMITS = {
  // Acceso nivel Pro, expira en 14 días (Restaurante.trial_ends_at).
  trial: {
    maxOrdenes:      Infinity,
    maxUsuarios:     Infinity,
    maxLocales:      1,
    websocket:       true,
    analytics:       true,
    pdf:             true,
    apiKeys:         false,
    supportPriority: false,
  },
  pro: {
    price:           22, // USD/mes
    maxOrdenes:      Infinity,
    maxUsuarios:     Infinity,
    maxLocales:      1,
    websocket:       true,
    analytics:       true,
    pdf:             true,
    apiKeys:         false,
    supportPriority: false,
  },
  business: {
    price:           49, // USD/mes
    maxOrdenes:      Infinity,
    maxUsuarios:     Infinity,
    maxLocales:      5,
    websocket:       true,
    analytics:       true,
    pdf:             true,
    apiKeys:         true,
    supportPriority: true,
  },
  // Bloqueo total — sin acceso operativo. Resultado de cancelar una
  // suscripción de pago (ver server/routes/billing.js). resolvePlanAccess()
  // bloquea explícitamente por nombre de plan, no por estos valores en cero
  // — quedan acá para que el plan sea inspeccionable (ej. futura UI de
  // facturación que muestre "qué perdés al cancelar").
  cancelled: {
    maxOrdenes:      0,
    maxUsuarios:     0,
    maxLocales:      0,
    websocket:       false,
    analytics:       false,
    pdf:             false,
    apiKeys:         false,
    supportPriority: false,
  },
};

// Qué plan se necesita para cada feature, usando las claves legacy con las
// que los callers de checkPlanFeature() ya invocan la función (ver abajo) —
// apikeys.js pasa 'api_keys', no 'apiKeys'. No se tocan esos callers.
const PLAN_REQUERIDO = {
  websocket: 'pro',
  analytics: 'pro',
  pdf:       'pro',
  api_keys:  'business',
};

// checkOrderLimit/checkUserLimit (server/middleware/checkPlanLimit.js) y
// GET /api/billing/usage (server/routes/billing.js) leen ordenes_mes /
// usuarios_max — nombres legacy de antes de esta consolidación. No se
// tocan esos archivos, así que resolvePlanAccess() expone ambos vocabularios
// en el mismo objeto: los campos canónicos (maxOrdenes, apiKeys, ...) tal
// cual están arriba, más los alias legacy que ya esperan esos callers.
function toLegacyShape(canonical) {
  return {
    ...canonical,
    ordenes_mes:  canonical.maxOrdenes,
    usuarios_max: canonical.maxUsuarios,
    locales_max:  canonical.maxLocales,
    api_keys:     canonical.apiKeys,
  };
}

/**
 * Resuelve si un restaurante tiene acceso activo a algún plan.
 * Centraliza dos bloqueos usados por checkOrderLimit, checkUserLimit y
 * checkPlanFeature: trial vencido, y plan cancelado/sin entrada en
 * PLAN_LIMITS.
 */
function resolvePlanAccess({ plan, trial_ends_at }) {
  if (plan === 'trial' && trial_ends_at && new Date(trial_ends_at) < new Date()) {
    return {
      blocked: true,
      error:   'trial_expired',
      message: 'Tu período de prueba venció. Elige un plan para continuar.',
    };
  }

  // 'cancelled' SIEMPRE bloquea, aunque tenga entrada en PLAN_LIMITS — los
  // valores en cero son solo para que el plan sea inspeccionable, no para
  // que checkOrderLimit/checkUserLimit lo bloqueen indirectamente comparando
  // contra 0 (eso cambiaría el código de error que ve el cliente).
  if (plan === 'cancelled' || !PLAN_LIMITS[plan]) {
    return {
      blocked: true,
      error:   'no_plan',
      message: 'Tu cuenta no tiene un plan activo. Elige un plan para continuar.',
    };
  }

  return { blocked: false, limits: toLegacyShape(PLAN_LIMITS[plan]) };
}

function checkPlanFeature(featureKey) {
  return async (req, res, next) => {
    try {
      const prisma = req.prisma;
      const rid    = req.user?.restaurante_id;
      if (!rid) return res.status(401).json({ error: 'No autorizado' });

      const restaurante = await prisma.restaurante.findUnique({
        where:  { id: rid },
        select: { plan: true, trial_ends_at: true },
      });
      if (!restaurante) return res.status(404).json({ error: 'Restaurante no encontrado' });

      const access = resolvePlanAccess(restaurante);
      if (access.blocked) {
        return res.status(403).json({ error: access.error, message: access.message, upgrade_url: '/billing' });
      }

      if (!access.limits[featureKey]) {
        const planRequerido = PLAN_REQUERIDO[featureKey] || 'pro';
        return res.status(403).json({
          error:          'plan_required',
          feature:        featureKey,
          plan_actual:    restaurante.plan,
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

module.exports = { PLAN_LIMITS, PLAN_REQUERIDO, resolvePlanAccess, checkPlanFeature };
