'use strict';
const path = require('path');

module.exports = {
  apps: [
    {
      name: 'mastexopos',
      script: path.join(__dirname, 'server', 'index.js'),
      cwd: path.join(__dirname, 'server'),

      // WEB_CONCURRENCY lo inyecta Railway/Heroku automáticamente según los vCPU asignados.
      // "max" usa todos los núcleos físicos del host.
      instances: process.env.WEB_CONCURRENCY || 'max',
      exec_mode: 'cluster',

      // Graceful shutdown: PM2 envía SIGINT y espera hasta kill_timeout ms antes de SIGKILL.
      kill_timeout: 5000,
      // wait_ready + listen_timeout: PM2 no considera el worker activo hasta que emita
      // process.send('ready') desde server/index.js.
      wait_ready: true,
      listen_timeout: 10000,

      max_memory_restart: '512M',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
      watch: false,

      // merge_logs: un archivo por nivel en lugar de uno por worker
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: path.join(__dirname, 'logs', 'pm2-error.log'),
      out_file:   path.join(__dirname, 'logs', 'pm2-out.log'),
      merge_logs: true,

      env: {
        NODE_ENV: 'development',
        PORT: 9000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 9000,
        // REDIS_URL, DATABASE_URL, JWT_SECRET → se inyectan desde CI/CD o .env.staging
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 9000,
        // REDIS_URL es obligatorio en producción: sin él cada worker tiene su propio
        // rate-limit counter, Socket.io no puede hacer broadcast cross-worker, y el
        // caché en memoria no se comparte entre instancias.
      },
    },
  ],
};
