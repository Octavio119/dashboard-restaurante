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
 */
export function usePlan() {
  const { user } = useAuth();

  const rawPlan   = user?.plan ?? user?.restaurante?.plan ?? 'free';
  // Normalise: 'starter' (legacy UI key) → 'free' (backend key)
  const plan       = rawPlan === 'starter' ? 'free' : rawPlan;
  const planStatus = user?.plan_status ?? 'active';
  const planLabel  = PLAN_NAMES[plan] ?? 'Starter';

  /** Whether the current plan includes a feature. */
  const can = (feature) => PLAN_LIMITS[plan]?.[feature] ?? false;

  /** Which plan name unlocks a feature, e.g. "Pro" or "Business". */
  const requiredPlanFor = (feature) => {
    const key = FEATURE_PLAN[feature] ?? 'pro';
    return PLAN_NAMES[key] ?? 'Pro';
  };

  const isStarter  = plan === 'free';
  const isPro      = plan === 'pro' || plan === 'business';
  const isBusiness = plan === 'business';

  const ordersLimit   = PLAN_LIMITS[plan]?.ordersPerMonth ?? 50;

  return {
    plan,
    planLabel,
    planStatus,
    can,
    requiredPlanFor,
    isStarter,
    isPro,
    isBusiness,
    ordersLimit,
  };
}
