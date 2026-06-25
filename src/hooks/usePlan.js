import { useAuth } from '../AuthContext';
import { PLAN_LIMITS, PLAN_NAMES, FEATURE_PLAN } from '../config/plans';

/**
 * Hook central de autorización por plan.
 *
 * Lee plan desde:
 *   1. user.plan        — presente después de login/refresh (viene en JWT)
 *   2. user.restaurante.plan — presente después de api.me() al cargar la página
 *
 * plan_status lee de user.plan_status (JWT) — si no existe asume 'active'.
 * trial_ends_at sigue el mismo patrón (flat o anidado bajo restaurante).
 */
export function usePlan() {
  const { user } = useAuth();

  const plan        = user?.plan ?? user?.restaurante?.plan ?? 'trial';
  const planStatus   = user?.plan_status ?? 'active';
  const trialEndsAt  = user?.trial_ends_at ?? user?.restaurante?.trial_ends_at ?? null;
  const planLabel    = PLAN_NAMES[plan] ?? 'Trial';

  /** Whether the current plan includes a feature. */
  const can = (feature) => PLAN_LIMITS[plan]?.[feature] ?? false;

  /** Which plan name unlocks a feature, e.g. "Pro" or "Business". */
  const requiredPlanFor = (feature) => {
    const key = FEATURE_PLAN[feature] ?? 'pro';
    return PLAN_NAMES[key] ?? 'Pro';
  };

  const isTrial     = plan === 'trial';
  const isPro       = plan === 'pro' || plan === 'business';
  const isBusiness  = plan === 'business';

  const trialDaysLeft = isTrial && trialEndsAt
    ? Math.ceil((new Date(trialEndsAt) - new Date()) / (24 * 60 * 60 * 1000))
    : null;
  const trialExpired  = isTrial && trialDaysLeft !== null && trialDaysLeft <= 0;

  const ordersLimit   = PLAN_LIMITS[plan]?.ordersPerMonth ?? 0;

  return {
    plan,
    planLabel,
    planStatus,
    can,
    requiredPlanFor,
    isTrial,
    isPro,
    isBusiness,
    trialEndsAt,
    trialDaysLeft,
    trialExpired,
    ordersLimit,
  };
}
