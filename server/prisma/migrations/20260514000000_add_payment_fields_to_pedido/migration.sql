-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN "payment_captured_at" TIMESTAMP(3),
                     ADD COLUMN "payment_provider" TEXT,
                     ADD COLUMN "payment_status" TEXT,
                     ADD COLUMN "payment_transaction_id" TEXT;
