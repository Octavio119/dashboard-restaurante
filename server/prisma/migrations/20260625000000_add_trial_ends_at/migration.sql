-- Soporta el trial de 14 días que reemplaza al plan free: nuevos restaurantes
-- arrancan con plan='trial' y trial_ends_at=now()+14d (server/routes/auth.js).
-- checkOrderLimit/checkUserLimit/checkPlanFeature bloquean con 403 cuando
-- plan='trial' y trial_ends_at ya pasó.
ALTER TABLE "Restaurante" ADD COLUMN "trial_ends_at" TIMESTAMP(3);
ALTER TABLE "Restaurante" ALTER COLUMN "plan" SET DEFAULT 'trial';

-- Data migration: el plan free deja de existir en PLAN_LIMITS (server/lib/planLimits.js).
-- Los restaurantes que hoy están en 'free' pasan a 'trial' con 14 días frescos desde
-- que se aplica esta migración, en vez de quedar bloqueados de inmediato.
UPDATE "Restaurante"
SET "plan" = 'trial', "trial_ends_at" = now() + interval '14 days'
WHERE "plan" = 'free';
