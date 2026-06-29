'use strict';
const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

const CLOUDINARY_CONFIGURED = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
);

if (CLOUDINARY_CONFIGURED) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Sube una imagen (data URL base64) a Cloudinary y devuelve la URL https.
// Si Cloudinary no está configurado, no falla la request del caller —
// devuelve null y el caller decide si conservar la imagen_url existente.
async function uploadImage(base64, folder = 'mastexopos/menu') {
  if (!CLOUDINARY_CONFIGURED) {
    logger.warn('CLOUDINARY_* no configurado — uploadImage omitido');
    return null;
  }
  if (!base64) return null;

  try {
    const result = await cloudinary.uploader.upload(base64, { folder });
    return result.secure_url;
  } catch (e) {
    logger.error({ err: e }, 'Cloudinary uploadImage error');
    return null;
  }
}

module.exports = { uploadImage, CLOUDINARY_CONFIGURED };
