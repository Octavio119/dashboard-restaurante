'use strict';

const { PLAN_LIMITS, PLAN_REQUERIDO } = require('../lib/planLimits');

const STATUS_MESSAGES = {
  past_due:  'Tu suscripción tiene un pago vencido. Actualiza tu método de pago para continuar.',
  cancelled: 'Tu suscripción fue cancelada. Renueva tu plan para continuar.',
};

async function _getRestaurante(req) {
  const rid = req.user?.restaurante_id;
  if (!rid) return null;
  return req.prisma.restaurante.findUnique({
    where:  { id: rid },
    select: { plan: true, plan_status: true },
  });
}

function _rejectStatus(res, plan_status) {
  return res.status(402).json({
    error:       'PAYMENT_REQUIRED',
    plan_status,
    message:     STATUS_MESSAGES[plan_status] || 'Pago requerido.',
    upgrade_url: '/billing',
  });
}

/**
 * Verifica que el plan esté activo (no past_due ni cancelled).
 * Usar en rutas que son de pago pero no requieren feature específica.
 */
function requireActivePlan() {
  return async (req, res, next) => {
    try {
      const rid = req.user?.restaurante_id;
      if (!rid) return res.status(401).json({ error: 'No autorizado' });

      const rest = await _getRestaurante(req);
      if (!rest) return res.status(404).json({ error: 'Restaurante no encontrado' });

      const status = rest.plan_status || 'active';
      if (status === 'past_due' || status === 'cancelled') {
        return _rejectStatus(res, status);
      }

      next();
    } catch (e) {
      next(e);
    }
  };
}

/**
 * Verifica acceso a una feature según el plan.
 * Responde 402 si el plan está vencido/cancelado, 403 si el plan no incluye la feature.
 *
 * Error shapes:
 *   402 → { error: "PAYMENT_REQUIRED", plan_status, message, upgrade_url }
 *   403 → { error: "PLAN_LIMIT", feature, requiredPlan, currentPlan, upgrade_url }
 */
function requireFeature(feature) {
  return async (req, res, next) => {
    try {
      const rid = req.user?.restaurante_id;
      if (!rid) return res.status(401).json({ error: 'No autorizado' });

      const rest = await _getRestaurante(req);
      if (!rest) return res.status(404).json({ error: 'Restaurante no encontrado' });

      const status = rest.plan_status || 'active';
      if (status === 'past_due' || status === 'cancelled') {
        return _rejectStatus(res, status);
      }

      const plan   = rest.plan || 'free';
      const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

      if (!limits[feature]) {
        const requiredPlan = PLAN_REQUERIDO[feature] || 'pro';
        return res.status(403).json({
          error:       'PLAN_LIMIT',
          feature,
          requiredPlan,
          currentPlan: plan,
          upgrade_url: '/billing',
        });
      }

      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = { requireFeature, requireActivePlan };
