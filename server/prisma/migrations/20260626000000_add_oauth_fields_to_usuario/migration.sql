-- Google OAuth ("Continuar con Google") — server/routes/oauth.js.
-- Se agregan a Usuario, no a Restaurante: email/login son del Usuario
-- (Restaurante es el tenant/negocio, sin campo email).
ALTER TABLE "Usuario" ADD COLUMN "oauth_provider" TEXT;
ALTER TABLE "Usuario" ADD COLUMN "oauth_id" TEXT;
