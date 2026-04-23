const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('./logger');

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  R2_PUBLIC_URL,
} = process.env;

let r2 = null;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  logger.warn('R2 no configurado — uploads de logos deshabilitados. Configura R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY y R2_BUCKET.');
} else {
  r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Sube un buffer a R2 y retorna la URL pública.
 * @param {string} key  - Ruta dentro del bucket (ej: "123/logo-123-1234567890.png")
 * @param {Buffer} buffer
 * @param {string} contentType
 * @returns {Promise<string>} URL pública del archivo
 */
async function upload(key, buffer, contentType) {
  if (!r2) throw new Error('R2 no está configurado. Revisa las variables de entorno R2_*.');

  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  const base = R2_PUBLIC_URL
    ? R2_PUBLIC_URL.replace(/\/$/, '')
    : `https://pub-${R2_ACCOUNT_ID}.r2.dev`;

  return `${base}/${key}`;
}

/**
 * Elimina un objeto de R2 (best-effort, no lanza si falla).
 * @param {string} key
 */
async function remove(key) {
  if (!r2) return;
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  } catch {
    // non-fatal
  }
}

module.exports = { upload, remove, isConfigured: () => r2 !== null };
