-- schema.prisma ya declaraba Restaurante.plan_status y Restaurante.plan_expires_at
-- desde antes de esta sesión, pero la migración que las crea nunca se aplicó en
-- Supabase. Esto rompía cualquier query sin `select` explícito sobre Restaurante
-- (ej. signup) con "column does not exist". Se detectó al levantar el servidor
-- contra la BD real y probar /api/auth/signup.

ALTER TABLE "Restaurante" ADD COLUMN "plan_status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "Restaurante" ADD COLUMN "plan_expires_at" TIMESTAMP(3);
