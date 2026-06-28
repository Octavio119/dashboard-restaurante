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

// Cron de emails de trial (día 0 bienvenida, día 11-13 advertencia, día 14
// vencido) — solo en producción, igual que se evita en dev/test cualquier
// otro side-effect con efecto real (envío de correo) al arrancar el server.
if (process.env.NODE_ENV === 'production') {
  require('./lib/trialEmails');
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

  // Prisma puede lanzar PrismaClientRustPanicError ("timer has gone away")
  // cuando el query engine (Rust) entra en pánico — el proceso queda en un
  // estado inconsistente sin forma de recuperación desde JS. Salir con
  // exit(1) deja que Railway reinicie el proceso automáticamente en vez de
  // dejar el servidor inutilizable hasta un reinicio manual.
  function isPrismaPanic(err) {
    return err?.name === 'PrismaClientRustPanicError'
      || (typeof err?.message === 'string' && err.message.includes('timer has gone away'));
  }

  process.on('unhandledRejection', (err) => {
    if (isPrismaPanic(err)) {
      logger.fatal({ err }, 'Prisma panic en unhandledRejection — reiniciando proceso');
      process.exit(1);
    }
    logger.error({ err }, 'unhandledRejection');
    process.exit(1);
  });

  process.on('uncaughtException', (err) => {
    if (isPrismaPanic(err)) {
      logger.fatal({ err }, 'Prisma panic en uncaughtException — reiniciando proceso');
      process.exit(1);
    }
    logger.fatal({ err }, 'uncaughtException');
    process.exit(1);
  });
})();
