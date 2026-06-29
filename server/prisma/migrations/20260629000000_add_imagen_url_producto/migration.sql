-- Foto del plato (Cloudinary URL segura), nullable: productos existentes quedan sin imagen
ALTER TABLE "Producto" ADD COLUMN "imagen_url" TEXT;
