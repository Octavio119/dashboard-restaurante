/**
 * Valida variables de entorno al arrancar el servidor.
 * Lanza si alguna obligatoria falta; advierte si opcionales están ausentes.
 */
const logger = require('./logger');

const REQUIRED = [
  { key: 'DATABASE_URL',  hint: 'postgresql://user:pass@host:5432/dbname' },
  { key: 'JWT_SECRET',    hint: 'cadena aleatoria >= 32 chars' },
];

const OPTIONAL = [
  { key: 'REDIS_URL',              hint: 'redis:// o rediss:// — WebSocket multi-instancia' },
  { key: 'R2_ACCOUNT_ID',          hint: 'Cloudflare R2 — subida de logos' },
  { key: 'R2_ACCESS_KEY_ID',       hint: 'Cloudflare R2' },
  { key: 'R2_SECRET_ACCESS_KEY',   hint: 'Cloudflare R2' },
  { key: 'R2_BUCKET',              hint: 'Cloudflare R2 bucket name' },
  { key: 'R2_PUBLIC_URL',          hint: 'URL pública del bucket (custom domain)' },
  { key: 'FRONTEND_URL',           hint: 'URL del frontend — CORS en producción' },
  { key: 'SMTP_HOST',              hint: 'Alertas de stock bajo por email' },
  { key: 'SMTP_USER',              hint: 'Usuario SMTP' },
  { key: 'SMTP_PASS',              hint: 'Contraseña / app-password SMTP' },
  { key: 'ALERT_EMAIL',            hint: 'Email destino para alertas de stock' },
];

function validateEnv() {
  const missing = REQUIRED.filter(({ key }) => !process.env[key]);

  if (missing.length > 0) {
    for (const { key, hint } of missing) {
      logger.fatal({ key, hint }, `Variable de entorno requerida faltante: ${key}`);
    }
    logger.fatal('El servidor no puede iniciar sin las variables requeridas. Revisa .env o las variables del servicio de deploy.');
    process.exit(1);
  }

  const unset = OPTIONAL.filter(({ key }) => !process.env[key]);
  if (unset.length > 0) {
    for (const { key, hint } of unset) {
      logger.warn({ key, hint }, `Variable opcional no configurada: ${key}`);
    }
  }

  // Validaciones de formato
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://') && !process.env.DATABASE_URL.startsWith('postgres://')) {
    logger.warn({ key: 'DATABASE_URL' }, 'DATABASE_URL no parece ser una URL de PostgreSQL válida');
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn({ key: 'JWT_SECRET' }, 'JWT_SECRET es muy corto (< 32 chars) — inseguro en producción');
  }

  logger.info('Validación de variables de entorno OK');
}

module.exports = validateEnv;
