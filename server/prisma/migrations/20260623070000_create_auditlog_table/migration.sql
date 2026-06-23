-- AuditLog está en schema.prisma desde antes de esta sesión pero la tabla
-- nunca se creó en Supabase. lib/audit.js ya envuelve cada audit() en
-- try/catch, así que esto no rompía requests — pero significaba que el
-- audit trail nunca se estaba guardando, en silencio. Detectado al levantar
-- el servidor contra la BD real.

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

CREATE INDEX "AuditLog_restaurante_id_idx" ON "AuditLog"("restaurante_id");
CREATE INDEX "AuditLog_restaurante_id_created_at_idx" ON "AuditLog"("restaurante_id", "created_at");
