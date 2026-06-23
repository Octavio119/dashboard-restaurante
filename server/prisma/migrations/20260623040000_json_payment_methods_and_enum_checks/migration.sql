-- ConfigNegocio.payment_methods guardaba JSON serializado a mano en un TEXT,
-- forzando JSON.parse/JSON.stringify en cada lectura/escritura (server/routes/config.js).
-- Se convierte a jsonb nativo: el texto ya almacenado es JSON válido, así que el
-- cast directo no pierde datos.
ALTER TABLE "ConfigNegocio" ALTER COLUMN "payment_methods" SET DATA TYPE JSONB USING "payment_methods"::jsonb;
ALTER TABLE "ConfigNegocio" ALTER COLUMN "payment_methods" SET DEFAULT '{"cash":true,"card":true,"transfer":true,"qr":false}'::jsonb;

-- Campos que hoy son String libre pero en la práctica solo aceptan un set fijo
-- de valores validado en JS (routes/*.js). Prisma 5.22 no soporta @@check en el
-- schema (validado: "Attribute not known: @check"), así que el constraint vive
-- solo a nivel de Postgres — no aparece en schema.prisma, pero protege la
-- integridad de datos aunque algún script o acceso directo a la BD se salte
-- la validación de la app.
--
-- Se agregan con NOT VALID a propósito: ADD CONSTRAINT normal escanea y
-- valida TODAS las filas existentes en el mismo statement, y si hay una sola
-- fila con un valor legado que no calza (typo, acento distinto, dato viejo
-- de la migración SQLite→Postgres) toda la migración falla a mitad de camino.
-- NOT VALID aplica el constraint solo a partir de ahora (inserts/updates
-- nuevos) sin tocar filas existentes. Antes de correr el VALIDATE CONSTRAINT
-- de abajo, revisar en Supabase que no haya filas fuera de estos sets, ej.:
--   SELECT DISTINCT estado FROM "Cliente";
--   SELECT DISTINCT rol FROM "Usuario";
--   SELECT DISTINCT estado FROM "Pedido";
--   SELECT DISTINCT metodo_pago FROM "Pedido";
--   SELECT DISTINCT metodo_pago FROM "Venta";
--   SELECT DISTINCT estado FROM "Reserva";
--   SELECT DISTINCT estado FROM "Caja";
--   SELECT DISTINCT plan_status FROM "Restaurante";

ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_estado_check"
  CHECK ("estado" IN ('Nuevo', 'Regular', 'VIP')) NOT VALID;

ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_tipo_cliente_check"
  CHECK ("tipo_cliente" IN ('persona', 'empresa')) NOT VALID;

-- 'super_admin' es el rol root multi-tenant (middleware/verifyRole.js) —
-- no lo asigna ninguna ruta hoy, pero está en el set válido.
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_rol_check"
  CHECK ("rol" IN ('admin', 'gerente', 'chef', 'staff', 'super_admin')) NOT VALID;

ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_estado_check"
  CHECK ("estado" IN ('pendiente', 'en preparación', 'listo', 'confirmado', 'entregado', 'cancelado')) NOT VALID;

ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_metodo_pago_check"
  CHECK ("metodo_pago" IN ('efectivo', 'tarjeta', 'transferencia', 'qr', 'paypal')) NOT VALID;

ALTER TABLE "Venta" ADD CONSTRAINT "Venta_metodo_pago_check"
  CHECK ("metodo_pago" IN ('efectivo', 'tarjeta', 'transferencia', 'qr', 'paypal')) NOT VALID;

ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_estado_check"
  CHECK ("estado" IN ('pendiente', 'confirmada', 'asistió', 'cancelada')) NOT VALID;

ALTER TABLE "Caja" ADD CONSTRAINT "Caja_estado_check"
  CHECK ("estado" IN ('abierta', 'cerrada')) NOT VALID;

-- plan_status nunca se escribe hoy (siempre 'active' por default/fallback en JS),
-- pero los mensajes en middleware/planGuard.js confirman el set esperado.
ALTER TABLE "Restaurante" ADD CONSTRAINT "Restaurante_plan_status_check"
  CHECK ("plan_status" IN ('active', 'past_due', 'cancelled')) NOT VALID;

-- Una vez confirmado que no hay filas legadas fuera de rango, correr:
--   ALTER TABLE "Cliente" VALIDATE CONSTRAINT "Cliente_estado_check";
--   ALTER TABLE "Cliente" VALIDATE CONSTRAINT "Cliente_tipo_cliente_check";
--   ALTER TABLE "Usuario" VALIDATE CONSTRAINT "Usuario_rol_check";
--   ALTER TABLE "Pedido" VALIDATE CONSTRAINT "Pedido_estado_check";
--   ALTER TABLE "Pedido" VALIDATE CONSTRAINT "Pedido_metodo_pago_check";
--   ALTER TABLE "Venta" VALIDATE CONSTRAINT "Venta_metodo_pago_check";
--   ALTER TABLE "Reserva" VALIDATE CONSTRAINT "Reserva_estado_check";
--   ALTER TABLE "Caja" VALIDATE CONSTRAINT "Caja_estado_check";
--   ALTER TABLE "Restaurante" VALIDATE CONSTRAINT "Restaurante_plan_status_check";
