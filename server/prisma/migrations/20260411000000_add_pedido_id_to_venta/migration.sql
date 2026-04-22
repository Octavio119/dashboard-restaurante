-- AlterTable: add pedido_id reference to Venta for deduplication
ALTER TABLE "Venta" ADD COLUMN "pedido_id" INTEGER;

-- Unique index ensures one venta per pedido (anti-duplicate guard)
CREATE UNIQUE INDEX IF NOT EXISTS "Venta_pedido_id_key" ON "Venta"("pedido_id");
