/**
 * Fuente de verdad de planes del frontend: precios, features y límites.
 * Importar desde aquí — nunca hardcodear en componentes.
 *
 * Espejo de server/lib/planLimits.js — mismos valores, sincronizar a mano si
 * cambia uno de los dos (no hay build step que los comparta entre src/ y
 * server/). Los nombres de campo de PLAN_LIMITS NO son 1:1 con el backend:
 * se mantienen los que ya usa src/hooks/usePlan.js (can('analytics'),
 * can('apiKeys')) para no romper ese hook.
 *
 * "trial" reemplaza al viejo "free": acceso nivel Pro por 14 días
 * (server/routes/auth.js setea trial_ends_at al registrarse).
 * "cancelled" — bloqueo total tras cancelar una suscripción de pago.
 */

export const PLAN_LIMITS = {
  trial: {
    analytics:     true,
    ticketsPDF:    true,
    realtime:      true,
    apiKeys:       false,
    multiLocal:    false,
    ordersPerMonth: Infinity,
    users:         Infinity,
  },
  pro: {
    analytics:     true,
    ticketsPDF:    true,
    realtime:      true,
    apiKeys:       false,
    multiLocal:    false,
    ordersPerMonth: Infinity,
    users:         Infinity,
  },
  business: {
    analytics:     true,
    ticketsPDF:    true,
    realtime:      true,
    apiKeys:       true,
    multiLocal:    true,
    ordersPerMonth: Infinity,
    users:         Infinity,
  },
  cancelled: {
    analytics:     false,
    ticketsPDF:    false,
    realtime:      false,
    apiKeys:       false,
    multiLocal:    false,
    ordersPerMonth: 0,
    users:         0,
  },
};

// UI display names for each plan key
export const PLAN_NAMES = { trial: 'Trial', pro: 'Pro', business: 'Business', cancelled: 'Cancelado' };

// Which plan unlocks each feature (for upgrade prompts)
export const FEATURE_PLAN = {
  analytics:    'pro',
  ticketsPDF:   'pro',
  realtime:     'pro',
  apiKeys:      'business',
  multiLocal:   'business',
};

/**
 * Descriptor de planes para UI de marketing/pricing (Landing.jsx, Register.jsx).
 * trial.price es null a propósito — no se muestra precio para el trial.
 */
export const PLANS = {
  trial: {
    name:       'Trial',
    price:      null,
    maxLocales: 1,
    features: [
      'Acceso completo nivel Pro',
      'Pedidos y usuarios ilimitados',
      'Reportes y analytics en tiempo real',
      'Soporte incluido durante el trial',
    ],
  },
  pro: {
    name:       'Pro',
    price:      22,
    priceAnual: 18,
    label:      'USD / mes · sin contrato',
    trialDays:  14,
    maxLocales: 1,
    features: [
      'Pedidos ilimitados',
      'Usuarios ilimitados',
      '1 local',
      'Pedidos en tiempo real',
      'Analytics y reportes',
      'Exportar PDF',
    ],
  },
  business: {
    name:       'Business',
    price:      49,
    priceAnual: 39,
    label:      'USD / mes · sin contrato',
    trialDays:  14,
    maxLocales: 5,
    features: [
      'Todo lo del plan Pro',
      'Hasta 5 locales',
      'Integraciones con otros sistemas',
      'Soporte prioritario',
    ],
  },
};
