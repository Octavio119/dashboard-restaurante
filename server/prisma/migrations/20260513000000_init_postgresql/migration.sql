-- CreateTable
CREATE TABLE "Restaurante" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordenes_mes_actual" INTEGER NOT NULL DEFAULT 0,
    "billing_ciclo_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "paypal_subscription_id" TEXT,
    "locales_count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Restaurante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" SERIAL NOT NULL,
    "key_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "restaurante_id" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'staff',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "restaurante_id" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "telefono" TEXT NOT NULL DEFAULT '',
    "rut" TEXT NOT NULL DEFAULT '',
    "tipo_cliente" TEXT NOT NULL DEFAULT 'persona',
    "razon_social" TEXT NOT NULL DEFAULT '',
    "visitas" INTEGER NOT NULL DEFAULT 0,
    "total_gastado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'Nuevo',
    "restaurante_id" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "restaurante_id" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 10,
    "unidad" TEXT NOT NULL DEFAULT 'unidades',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "restaurante_id" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "cliente_nombre" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "metodo_pago" TEXT NOT NULL DEFAULT 'efectivo',
    "mesa" TEXT NOT NULL DEFAULT '',
    "personas" INTEGER NOT NULL DEFAULT 0,
    "fecha" TIMESTAMP(3) NOT NULL,
    "reserva_id" INTEGER,
    "restaurante_id" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoItem" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "producto_id" INTEGER,
    "nombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio_unitario" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "restaurante_id" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedidoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "telefono" TEXT NOT NULL DEFAULT '',
    "hora" TEXT NOT NULL,
    "personas" INTEGER NOT NULL,
    "mesa" TEXT NOT NULL DEFAULT '',
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "fecha" TIMESTAMP(3) NOT NULL,
    "consumo_base" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cliente_id" INTEGER,
    "restaurante_id" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservaConsumo" (
    "id" SERIAL NOT NULL,
    "reserva_id" INTEGER NOT NULL,
    "producto_id" INTEGER,
    "nombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio_unitario" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "restaurante_id" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservaConsumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" SERIAL NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "metodo_pago" TEXT NOT NULL,
    "cajero" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "restaurante_id" INTEGER NOT NULL DEFAULT 1,
    "pedido_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentaItem" (
    "id" SERIAL NOT NULL,
    "venta_id" INTEGER NOT NULL,
    "producto_id" INTEGER,
    "nombre" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "precio_unitario" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "restaurante_id" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VentaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caja" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "restaurante_id" INTEGER NOT NULL DEFAULT 1,
    "monto_inicial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_ventas" DOUBLE PRECISION,
    "total_efectivo" DOUBLE PRECISION,
    "monto_final" DOUBLE PRECISION,
    "diferencia" DOUBLE PRECISION,
    "cajero_apertura" TEXT NOT NULL DEFAULT '',
    "cajero_cierre" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'abierta',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "Caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigNegocio" (
    "id" SERIAL NOT NULL,
    "restaurante_id" INTEGER NOT NULL DEFAULT 1,
    "nombre" TEXT NOT NULL DEFAULT 'Mi Restaurante',
    "rut" TEXT NOT NULL DEFAULT '',
    "direccion" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT '$',
    "currency_code" TEXT NOT NULL DEFAULT 'CLP',
    "open_time" TEXT NOT NULL DEFAULT '11:00',
    "close_time" TEXT NOT NULL DEFAULT '23:30',
    "tax_rate" DOUBLE PRECISION NOT NULL DEFAULT 19,
    "payment_methods" TEXT NOT NULL DEFAULT '{"cash":true,"card":true,"transfer":true,"qr":false}',
    "timezone" TEXT NOT NULL DEFAULT 'America/Santiago',
    "idioma" TEXT NOT NULL DEFAULT 'es',
    "formato_fecha" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "prefijo_ticket" TEXT NOT NULL DEFAULT 'TKT',
    "numero_inicial" INTEGER NOT NULL DEFAULT 1,
    "impuesto_activo" BOOLEAN NOT NULL DEFAULT true,
    "logo_url" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigNegocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "restaurante_id" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventarioMovimiento" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" TEXT,
    "proveedor_id" INTEGER,
    "restaurante_id" INTEGER NOT NULL DEFAULT 1,
    "stock_anterior" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventarioMovimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metadata" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Metadata_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "restaurante_id" INTEGER NOT NULL,
    "usuario_id" INTEGER,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT,
    "detalle" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Restaurante_slug_key" ON "Restaurante"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurante_stripe_customer_id_key" ON "Restaurante"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_hash_key" ON "ApiKey"("key_hash");

-- CreateIndex
CREATE INDEX "ApiKey_restaurante_id_idx" ON "ApiKey"("restaurante_id");

-- CreateIndex
CREATE INDEX "Usuario_restaurante_id_idx" ON "Usuario"("restaurante_id");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_restaurante_id_key" ON "Usuario"("email", "restaurante_id");

-- CreateIndex
CREATE INDEX "Cliente_restaurante_id_idx" ON "Cliente"("restaurante_id");

-- CreateIndex
CREATE INDEX "Categoria_restaurante_id_idx" ON "Categoria"("restaurante_id");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_restaurante_id_key" ON "Categoria"("nombre", "restaurante_id");

-- CreateIndex
CREATE INDEX "Producto_restaurante_id_idx" ON "Producto"("restaurante_id");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_numero_key" ON "Pedido"("numero");

-- CreateIndex
CREATE INDEX "Pedido_restaurante_id_idx" ON "Pedido"("restaurante_id");

-- CreateIndex
CREATE INDEX "Pedido_restaurante_id_fecha_idx" ON "Pedido"("restaurante_id", "fecha");

-- CreateIndex
CREATE INDEX "Pedido_restaurante_id_estado_idx" ON "Pedido"("restaurante_id", "estado");

-- CreateIndex
CREATE INDEX "PedidoItem_pedido_id_idx" ON "PedidoItem"("pedido_id");

-- CreateIndex
CREATE INDEX "PedidoItem_restaurante_id_idx" ON "PedidoItem"("restaurante_id");

-- CreateIndex
CREATE INDEX "Reserva_restaurante_id_idx" ON "Reserva"("restaurante_id");

-- CreateIndex
CREATE INDEX "Reserva_restaurante_id_fecha_idx" ON "Reserva"("restaurante_id", "fecha");

-- CreateIndex
CREATE INDEX "Reserva_restaurante_id_estado_idx" ON "Reserva"("restaurante_id", "estado");

-- CreateIndex
CREATE INDEX "ReservaConsumo_reserva_id_idx" ON "ReservaConsumo"("reserva_id");

-- CreateIndex
CREATE INDEX "ReservaConsumo_restaurante_id_idx" ON "ReservaConsumo"("restaurante_id");

-- CreateIndex
CREATE UNIQUE INDEX "Venta_ticket_id_key" ON "Venta"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "Venta_pedido_id_key" ON "Venta"("pedido_id");

-- CreateIndex
CREATE INDEX "Venta_restaurante_id_idx" ON "Venta"("restaurante_id");

-- CreateIndex
CREATE INDEX "Venta_restaurante_id_fecha_idx" ON "Venta"("restaurante_id", "fecha");

-- CreateIndex
CREATE INDEX "VentaItem_venta_id_idx" ON "VentaItem"("venta_id");

-- CreateIndex
CREATE INDEX "VentaItem_restaurante_id_idx" ON "VentaItem"("restaurante_id");

-- CreateIndex
CREATE INDEX "Caja_restaurante_id_idx" ON "Caja"("restaurante_id");

-- CreateIndex
CREATE UNIQUE INDEX "Caja_fecha_restaurante_id_key" ON "Caja"("fecha", "restaurante_id");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigNegocio_restaurante_id_key" ON "ConfigNegocio"("restaurante_id");

-- CreateIndex
CREATE INDEX "Proveedor_restaurante_id_idx" ON "Proveedor"("restaurante_id");

-- CreateIndex
CREATE INDEX "InventarioMovimiento_restaurante_id_idx" ON "InventarioMovimiento"("restaurante_id");

-- CreateIndex
CREATE INDEX "InventarioMovimiento_producto_id_idx" ON "InventarioMovimiento"("producto_id");

-- CreateIndex
CREATE INDEX "AuditLog_restaurante_id_idx" ON "AuditLog"("restaurante_id");

-- CreateIndex
CREATE INDEX "AuditLog_restaurante_id_created_at_idx" ON "AuditLog"("restaurante_id", "created_at");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservaConsumo" ADD CONSTRAINT "ReservaConsumo_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "Reserva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservaConsumo" ADD CONSTRAINT "ReservaConsumo_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservaConsumo" ADD CONSTRAINT "ReservaConsumo_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaItem" ADD CONSTRAINT "VentaItem_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaItem" ADD CONSTRAINT "VentaItem_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigNegocio" ADD CONSTRAINT "ConfigNegocio_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventarioMovimiento" ADD CONSTRAINT "InventarioMovimiento_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventarioMovimiento" ADD CONSTRAINT "InventarioMovimiento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventarioMovimiento" ADD CONSTRAINT "InventarioMovimiento_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventarioMovimiento" ADD CONSTRAINT "InventarioMovimiento_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
