'use strict';

// Este archivo es usado dentro del contenedor Docker (server/ es la raíz de trabajo).
// Para desarrollo local desde la raíz del repo, usa el ecosystem.config.cjs de la raíz.

module.exports = {
  apps: [
    {
      name: 'mastexopos',
      script: 'index.js',
      cwd: __dirname,

      instances: process.env.WEB_CONCURRENCY || 'max',
      exec_mode: 'cluster',

      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      max_memory_restart: '512M',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
      watch: false,

      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // En Docker los logs van a /logs (volumen externo recomendado)
      error_file: '/logs/pm2-error.log',
      out_file:   '/logs/pm2-out.log',
      merge_logs: true,

      env: {
        NODE_ENV: 'development',
        PORT: 9000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 9000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
      },
    },
  ],
};
