'use strict';
const crypto = require('crypto');

// Comparación constant-time vía hash de longitud fija — evita el timing leak
// de comparar strings de longitud distinta directamente con ===.
function safeCompare(a, b) {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// Usado tanto por server/routes/admin.js (gate del panel) como por
// checkPlanLimit.js/planLimits.js (bypass de límites de plan vía header).
function hasValidAdminCode(req) {
  const expected = process.env.ADMIN_CODE;
  if (!expected) return false;
  const provided = req.headers?.['x-admin-code'] || req.query?.code;
  return !!provided && safeCompare(provided, expected);
}

module.exports = { safeCompare, hasValidAdminCode };
