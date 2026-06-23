-- schema.prisma ya declaraba estos 4 campos en Pedido desde antes de esta
-- sesión (pensados para pagos directos vía Stripe/PayPal), pero la migración
-- que los crea nunca se aplicó en Supabase. Sin ellos, cualquier
-- pedido.create()/findFirst() sin `select` explícito fallaba con
-- "column does not exist" — crear pedidos estaba completamente roto.
-- Detectado al levantar el servidor contra la BD real y probar POST /api/pedidos.

ALTER TABLE "Pedido" ADD COLUMN "payment_status" TEXT;
ALTER TABLE "Pedido" ADD COLUMN "payment_provider" TEXT;
ALTER TABLE "Pedido" ADD COLUMN "payment_transaction_id" TEXT;
ALTER TABLE "Pedido" ADD COLUMN "payment_captured_at" TIMESTAMP(3);
