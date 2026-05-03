// JWT_SECRET is validated by validateEnv.js before this module loads.
// No fallback — a missing secret must crash the server, not silently use a weak default.
module.exports = {
  PORT:               process.env.PORT || 3000,
  JWT_SECRET:         process.env.JWT_SECRET,
  JWT_EXPIRES:        '1h',
  JWT_REFRESH_EXPIRES:'7d',
  ADMIN_CODE:         process.env.ADMIN_CODE || null,
};
