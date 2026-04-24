const { server } = require('./app');
const { init: initSocket } = require('./lib/socket');
const { PORT } = require('./config');
const logger = require('./lib/logger');

(async () => {
  await initSocket(server);

  server.listen(PORT, () => {
    console.log(`[server] Servidor listo en http://localhost:${PORT}`);
    logger.info({ port: PORT }, `Servidor listo en http://localhost:${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    logger.error({ err }, 'unhandledRejection');
    process.exit(1);
  });

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'uncaughtException');
    process.exit(1);
  });
})();
