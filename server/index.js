const { server } = require('./app');
const { init: initSocket } = require('./lib/socket');
const { PORT } = require('./config');

(async () => {
  await initSocket(server);

  server.listen(PORT, () => {
    console.log(`\n🚀 Servidor en http://localhost:${PORT}`);
    console.log(`   Auth:      POST /api/auth/login`);
    console.log(`   Endpoints: /api/pedidos  /api/reservas  /api/clientes  /api/productos`);
    console.log(`   WebSocket: ws://localhost:${PORT}\n`);
  });
})();
