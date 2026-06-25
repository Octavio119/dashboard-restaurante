const { server } = require('./app');
const { init: initSocket } = require('./lib/socket');
const { PORT } = require('./config');
const logger = require('./lib/logger');
const prisma = require('./lib/prisma');

// Resetea ordenes_mes_actual a 0 el 1ro de cada mes. Hoy es un no-op funcional
// (trial/pro/business tienen ordenes_mes: Infinity en PLAN_LIMITS), pero se deja
// programado por si en el futuro algún plan vuelve a tener límite mensual finito.
// Se programa con setTimeout al inicio del próximo mes; no requiere node-cron.
async function resetMonthlyOrders() {
  try {
    const result = await prisma.restaurante.updateMany({
      where: { plan: { in: ['trial', 'pro', 'business'] } },
      data:  { ordenes_mes_actual: 0, billing_ciclo_inicio: new Date() },
    });
    logger.info({ updated: result.count }, 'reset mensual de ordenes_mes_actual completado');
  } catch (err) {
    logger.error({ err }, 'reset mensual de ordenes_mes_actual fallido');
  }
}

function scheduleMonthlyReset() {
  const now   = new Date();
  const next1 = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 30, 0);
  const delay = next1.getTime() - now.getTime();

  setTimeout(async () => {
    await resetMonthlyOrders();
    scheduleMonthlyReset();
  }, delay);

  logger.info(
    { next_reset: next1.toISOString(), delay_ms: delay },
    'reset mensual programado'
  );
}

(async () => {
  await initSocket(server);

  server.listen(PORT, () => {
    console.log(`[server] Servidor listo en http://localhost:${PORT}`);
    logger.info({ port: PORT }, `Servidor listo en http://localhost:${PORT}`);
    scheduleMonthlyReset();
    // Señal para PM2 wait_ready — el worker no recibe tráfico hasta emitir esto
    if (process.send) process.send('ready');
  });

  // Graceful shutdown en modo cluster: PM2 envía SIGINT antes de SIGKILL (kill_timeout)
  process.on('SIGINT', () => {
    logger.info('SIGINT recibido — cerrando servidor HTTP');
    server.close(() => {
      logger.info('Servidor HTTP cerrado correctamente');
      process.exit(0);
    });
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
