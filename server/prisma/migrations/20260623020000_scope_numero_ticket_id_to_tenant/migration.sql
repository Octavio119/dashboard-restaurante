-- Pedido.numero y Venta.ticket_id eran @unique a nivel global: todos los
-- tenants competían por el mismo espacio de unicidad (ej. dos restaurantes
-- no podían tener ambos un pedido "#ORD-7282" el mismo día). Se reemplaza
-- por unicidad compuesta (campo, restaurante_id), que es lo que realmente
-- se necesita en un esquema multi-tenant.

DROP INDEX "Pedido_numero_key";
CREATE UNIQUE INDEX "Pedido_numero_restaurante_id_key" ON "Pedido"("numero", "restaurante_id");

DROP INDEX "Venta_ticket_id_key";
CREATE UNIQUE INDEX "Venta_ticket_id_restaurante_id_key" ON "Venta"("ticket_id", "restaurante_id");
