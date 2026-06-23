-- Todas las relaciones hacia Restaurante usaban el default implícito de
-- Prisma/Postgres (ON DELETE RESTRICT), así que borrar un restaurante
-- siempre fallaba con violación de FK — no había forma limpia de dar de
-- baja un tenant. Se cambia a ON DELETE CASCADE: al borrar un Restaurante,
-- toda su data (usuarios, productos, pedidos, ventas, etc.) se borra con él,
-- que es el comportamiento esperado para un offboarding completo de tenant.

ALTER TABLE "ApiKey" DROP CONSTRAINT "ApiKey_restaurante_id_fkey";
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_restaurante_id_fkey";
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Cliente" DROP CONSTRAINT "Cliente_restaurante_id_fkey";
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Categoria" DROP CONSTRAINT "Categoria_restaurante_id_fkey";
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Producto" DROP CONSTRAINT "Producto_restaurante_id_fkey";
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_restaurante_id_fkey";
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PedidoItem" DROP CONSTRAINT "PedidoItem_restaurante_id_fkey";
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reserva" DROP CONSTRAINT "Reserva_restaurante_id_fkey";
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReservaConsumo" DROP CONSTRAINT "ReservaConsumo_restaurante_id_fkey";
ALTER TABLE "ReservaConsumo" ADD CONSTRAINT "ReservaConsumo_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Venta" DROP CONSTRAINT "Venta_restaurante_id_fkey";
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VentaItem" DROP CONSTRAINT "VentaItem_restaurante_id_fkey";
ALTER TABLE "VentaItem" ADD CONSTRAINT "VentaItem_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Caja" DROP CONSTRAINT "Caja_restaurante_id_fkey";
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConfigNegocio" DROP CONSTRAINT "ConfigNegocio_restaurante_id_fkey";
ALTER TABLE "ConfigNegocio" ADD CONSTRAINT "ConfigNegocio_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Proveedor" DROP CONSTRAINT "Proveedor_restaurante_id_fkey";
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventarioMovimiento" DROP CONSTRAINT "InventarioMovimiento_restaurante_id_fkey";
ALTER TABLE "InventarioMovimiento" ADD CONSTRAINT "InventarioMovimiento_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TicketSecuencia" DROP CONSTRAINT "TicketSecuencia_restaurante_id_fkey";
ALTER TABLE "TicketSecuencia" ADD CONSTRAINT "TicketSecuencia_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;
