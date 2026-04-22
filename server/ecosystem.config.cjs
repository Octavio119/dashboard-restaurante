module.exports = {
  apps: [
    {
      name: 'dashboard-restaurante',
      script: 'index.js',
      cwd: __dirname,
      instances: process.env.WEB_CONCURRENCY || 'max',
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 9000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 9000,
      },
      error_file: '../logs/pm2-error.log',
      out_file:   '../logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
      watch: false,
    },
  ],
};
