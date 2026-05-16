/**
 * Fuente de verdad de planes: precios, features y límites.
 * Importar desde aquí — nunca hardcodear en componentes.
 *
 * El backend usa "free" como clave. El frontend lo muestra como "Starter".
 * PLAN_LIMITS usa las mismas claves que el backend (free / pro / business).
 */

export const PLAN_LIMITS = {
  free: {
    analytics:     false,
    ticketsPDF:    false,
    realtime:      false,
    apiKeys:       false,
    multiLocal:    false,
    ordersPerMonth: 50,
    users:         2,
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
};

// UI display names for each plan key
export const PLAN_NAMES = { free: 'Starter', pro: 'Pro', business: 'Business' };

// Which plan unlocks each feature (for upgrade prompts)
export const FEATURE_PLAN = {
  analytics:    'pro',
  ticketsPDF:   'pro',
  realtime:     'pro',
  apiKeys:      'business',
  multiLocal:   'business',
};

export const PLANS = {
  starter: {
    name:       'Starter',
    price:      0,
    priceAnual: 0,
    label:      'Para siempre gratis',
  },
  pro: {
    name:       'Pro',
    price:      22,
    priceAnual: 18,
    label:      'USD / mes · sin contrato',
  },
  business: {
    name:       'Business',
    price:      49,
    priceAnual: 39,
    label:      'USD / mes · sin contrato',
  },
};
