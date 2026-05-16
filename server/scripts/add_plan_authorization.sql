-- Migration: add plan_status and plan_expires_at to Restaurante
-- Apply manually in Supabase SQL editor if prisma db push fails

ALTER TABLE "Restaurante"
  ADD COLUMN IF NOT EXISTS plan_status     TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- Update any existing rows without plan_status
UPDATE "Restaurante" SET plan_status = 'active' WHERE plan_status IS NULL;
