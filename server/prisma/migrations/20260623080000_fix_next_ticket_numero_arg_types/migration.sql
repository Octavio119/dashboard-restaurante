-- next_ticket_numero (creada en 20260623000000_add_ticket_secuencia) tomaba
-- INTEGER para p_rid y p_inicial, pero Prisma envía estos parámetros como
-- BIGINT desde $queryRaw. bigint -> integer es un cast de "assignment", no
-- "implicit", así que Postgres no resuelve la llamada y falla con
-- "function next_ticket_numero(bigint, text, bigint) does not exist".
-- Detectado al confirmar un pedido (POST /api/pedidos/:id/estado) contra la
-- BD real. Se recrea la función con BIGINT — TicketSecuencia.restaurante_id
-- sigue siendo INTEGER en la tabla; el INSERT hace el cast de asignación sin
-- problema en esa dirección.

DROP FUNCTION IF EXISTS next_ticket_numero(INTEGER, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION next_ticket_numero(p_rid BIGINT, p_fecha TEXT, p_inicial BIGINT)
RETURNS INTEGER AS $$
  INSERT INTO "TicketSecuencia" (restaurante_id, fecha, ultimo_numero)
  VALUES (p_rid, p_fecha, p_inicial)
  ON CONFLICT (restaurante_id, fecha)
  DO UPDATE SET ultimo_numero = "TicketSecuencia".ultimo_numero + 1
  RETURNING ultimo_numero;
$$ LANGUAGE sql;
