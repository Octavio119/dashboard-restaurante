-- Float (double precision) -> Decimal(12,2) en todos los campos monetarios.
-- double precision no puede representar exactamente valores como 19.1 o 0.10,
-- y ese error se acumula en SUM/AVG a medida que crece el volumen de filas.
-- DECIMAL(12,2) en Postgres es exacto para aritmética y agregaciones SQL.
-- El cliente Prisma sigue devolviendo `number` en JS: ver la conversión
-- Decimal -> Number en server/lib/prisma.js (capa de extensión $allOperations).

ALTER TABLE "Cliente" ALTER COLUMN "total_gastado" SET DATA TYPE DECIMAL(12,2) USING "total_gastado"::numeric(12,2);

ALTER TABLE "Producto" ALTER COLUMN "precio" SET DATA TYPE DECIMAL(12,2) USING "precio"::numeric(12,2);

ALTER TABLE "Pedido" ALTER COLUMN "total" SET DATA TYPE DECIMAL(12,2) USING "total"::numeric(12,2);

ALTER TABLE "PedidoItem" ALTER COLUMN "precio_unitario" SET DATA TYPE DECIMAL(12,2) USING "precio_unitario"::numeric(12,2);

ALTER TABLE "Reserva" ALTER COLUMN "consumo_base" SET DATA TYPE DECIMAL(12,2) USING "consumo_base"::numeric(12,2);

ALTER TABLE "ReservaConsumo" ALTER COLUMN "precio_unitario" SET DATA TYPE DECIMAL(12,2) USING "precio_unitario"::numeric(12,2);

ALTER TABLE "Venta" ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(12,2) USING "subtotal"::numeric(12,2);
ALTER TABLE "Venta" ALTER COLUMN "total" SET DATA TYPE DECIMAL(12,2) USING "total"::numeric(12,2);

ALTER TABLE "VentaItem" ALTER COLUMN "precio_unitario" SET DATA TYPE DECIMAL(12,2) USING "precio_unitario"::numeric(12,2);

ALTER TABLE "Caja" ALTER COLUMN "monto_inicial" SET DATA TYPE DECIMAL(12,2) USING "monto_inicial"::numeric(12,2);
ALTER TABLE "Caja" ALTER COLUMN "total_ventas" SET DATA TYPE DECIMAL(12,2) USING "total_ventas"::numeric(12,2);
ALTER TABLE "Caja" ALTER COLUMN "total_efectivo" SET DATA TYPE DECIMAL(12,2) USING "total_efectivo"::numeric(12,2);
ALTER TABLE "Caja" ALTER COLUMN "monto_final" SET DATA TYPE DECIMAL(12,2) USING "monto_final"::numeric(12,2);
ALTER TABLE "Caja" ALTER COLUMN "diferencia" SET DATA TYPE DECIMAL(12,2) USING "diferencia"::numeric(12,2);

ALTER TABLE "ConfigNegocio" ALTER COLUMN "tax_rate" SET DATA TYPE DECIMAL(12,2) USING "tax_rate"::numeric(12,2);
