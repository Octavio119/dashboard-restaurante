-- CreateTable
CREATE TABLE "TicketSecuencia" (
    "id" SERIAL NOT NULL,
    "restaurante_id" INTEGER NOT NULL,
    "fecha" TEXT NOT NULL,
    "ultimo_numero" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TicketSecuencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketSecuencia_restaurante_id_fecha_key" ON "TicketSecuencia"("restaurante_id", "fecha");

-- CreateIndex
CREATE INDEX "TicketSecuencia_restaurante_id_idx" ON "TicketSecuencia"("restaurante_id");

-- AddForeignKey
ALTER TABLE "TicketSecuencia" ADD CONSTRAINT "TicketSecuencia_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Atomic counter: INSERT ... ON CONFLICT DO UPDATE is a single statement,
-- so Postgres serializes concurrent calls for the same (restaurante_id, fecha)
-- without an app-level retry loop or advisory lock.
CREATE OR REPLACE FUNCTION next_ticket_numero(p_rid INTEGER, p_fecha TEXT, p_inicial INTEGER)
RETURNS INTEGER AS $$
  INSERT INTO "TicketSecuencia" (restaurante_id, fecha, ultimo_numero)
  VALUES (p_rid, p_fecha, p_inicial)
  ON CONFLICT (restaurante_id, fecha)
  DO UPDATE SET ultimo_numero = "TicketSecuencia".ultimo_numero + 1
  RETURNING ultimo_numero;
$$ LANGUAGE sql;
