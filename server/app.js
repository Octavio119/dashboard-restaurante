require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const http      = require('http');
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const path      = require('path');
const fs        = require('fs');
const rateLimit  = require('express-rate-limit');
const swaggerUi  = require('swagger-ui-express');
const openApiSpec = require('./docs/openapi.json');
const prisma     = require('./lib/prisma');
const logger     = require('./lib/logger');
const validateEnv = require('./lib/validateEnv');

validateEnv();

const app = express();

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// ── Rate limiting ──────────────────────────────────────────────────────────────
// En modo cluster cada proceso tiene su propia memoria, por lo que los contadores
// del rate limiter no se comparten entre instancias. Con REDIS_URL configurado,
// usamos rate-limit-redis como store compartido para que el límite sea global.
let _rateLimitStore = null;
if (process.env.REDIS_URL) {
  try {
    const { RedisStore } = require('rate-limit-redis');
    const { createClient } = require('redis');
    const rlRedis = createClient({
      url: process.env.REDIS_URL,
      ...(process.env.REDIS_URL.startsWith('rediss://')
        ? { socket: { tls: true, rejectUnauthorized: false } }
        : {}),
    });
    rlRedis.on('error', err => logger.warn({ err }, '[rate-limit] Redis error'));
    rlRedis.connect()
      .then(() => {
        _rateLimitStore = new RedisStore({ sendCommand: (...args) => rlRedis.sendCommand(args) });
        logger.info('[rate-limit] Redis store activo — contadores compartidos en cluster');
      })
      .catch(err => logger.warn({ err }, '[rate-limit] Redis no disponible, usando store en memoria'));
  } catch {
    logger.warn('[rate-limit] rate-limit-redis no instalado, usando store en memoria');
  }
}

function makeLimiter(opts) {
  return rateLimit({ ...opts, ...(_rateLimitStore ? { store: _rateLimitStore } : {}) });
}

const apiLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Intenta en unos minutos.' },
  skip: (req) => req.path === '/api/health',
});

const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos de login. Intenta en 15 minutos.' },
});

// Limiter específico para endpoints de escritura — evita spam/DOS en creación de recursos
const writeLimiter = makeLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de creación. Intenta en un minuto.' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login',      authLimiter);
app.use('/api/auth/register',   authLimiter);
app.use('/api/auth/signup',     authLimiter);
// Rate limiting granular para endpoints de creación de recursos
['/api/pedidos', '/api/ventas', '/api/clientes', '/api/reservas', '/api/usuarios'].forEach(path => {
  app.post(path, writeLimiter);
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "https://*.paypal.com", "https://*.paypalobjects.com"],
      styleSrc:   ["'self'", "https://*.paypal.com"],
      imgSrc:     ["'self'", "data:", "blob:", "https://*.paypal.com", "https://*.paypalobjects.com"],
      connectSrc: ["'self'", "ws:", "wss:", "https://*.paypal.com", "https://*.sandbox.paypal.com"],
      fontSrc:    ["'self'", "https://*.paypalobjects.com"],
      objectSrc:  ["'none'"],
      frameSrc:   ["https://*.paypal.com", "https://*.sandbox.paypal.com"],
      baseUri:    ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy:            { policy: 'strict-origin-when-cross-origin' },
}));

app.use('/uploads', express.static(uploadsDir));
const allowedOrigins = [
  // localhost only in development — never in production
  ...(process.env.NODE_ENV !== 'production'
    ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:4173']
    : []),
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({ origin: allowedOrigins }));

// Raw body para webhooks — DEBE ir antes de express.json()
app.use(
  '/api/billing/webhook',
  express.raw({ type: 'application/json' }),
  (req, _res, next) => { req.body = JSON.parse(req.body); next(); }
);
app.use(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  (req, _res, next) => { req.body = req.body ? JSON.parse(req.body) : {}; next(); }
);

app.use(express.json({ limit: '10kb' }));
app.use((req, _res, next) => { req.prisma = prisma; next(); });

// ── HTTP request logging — debe ir ANTES de las rutas para capturar todas las peticiones ──
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]({ method: req.method, url: req.url, status: res.statusCode, ms,
      tenant: req.user?.restaurante_id }, 'request');
  });
  next();
});

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/billing',    require('./routes/billing'));
app.use('/api/pedidos',    require('./routes/pedidos'));
app.use('/api/reservas',   require('./routes/reservas'));
app.use('/api/clientes',   require('./routes/clientes'));
app.use('/api/productos',  require('./routes/productos'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/usuarios',   require('./routes/usuarios'));
app.use('/api/ventas',     require('./routes/ventas'));
app.use('/api/caja',       require('./routes/caja'));
app.use('/api/config',     require('./routes/config'));
app.use('/api/inventario', require('./routes/inventario'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/apikeys',   require('./routes/apikeys'));
app.use('/api/payments',  require('./routes/payments'));

app.get('/api/health', (_req, res) => {
  // Lazy-require para evitar dependencia circular en la inicialización
  const { getIO }  = require('./lib/socket');
  const cache      = require('./lib/cache');
  const io         = getIO();

  res.json({
    status:  'ok',
    ts:      new Date().toISOString(),
    uptime:  Math.floor(process.uptime()),           // segundos desde que arrancó el proceso
    version: process.env.npm_package_version || '1.0.0',
    worker:  process.env.NODE_APP_INSTANCE ?? 'standalone', // índice del worker PM2
    sockets: {
      // clientsCount = sockets conectados a ESTE worker; con Redis adapter la suma
      // real es la de todos los workers, pero eso requeriría un query a Redis.
      connected_this_worker: io?.engine?.clientsCount ?? 0,
    },
    redis: {
      configured: !!process.env.REDIS_URL,
      cache_ready: cache.isReady(),
    },
  });
});
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// ── Swagger UI ─────────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customSiteTitle: 'Dashboard Restaurante — API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

// ── Servir frontend compilado en producción ────────────────────────────────────
const publicDir = path.join(__dirname, 'public');
if (process.env.NODE_ENV === 'production' && fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
}

app.use((err, _req, res, _next) => {
  logger.error({ err }, 'unhandled error');
  res.status(500).json({ error: 'Error interno del servidor' });
});

const server = http.createServer(app);

module.exports = { app, server };
