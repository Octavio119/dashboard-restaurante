module.exports = {
  PORT:               process.env.PORT       || 9000,
  JWT_SECRET:         process.env.JWT_SECRET || 'dashboard_restaurante_secret_dev_2026',
  JWT_EXPIRES:        '1h',
  JWT_REFRESH_EXPIRES:'7d',
  ADMIN_CODE:         process.env.ADMIN_CODE || null,
};
