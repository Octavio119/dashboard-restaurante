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
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Intenta en unos minutos.' },
  skip: (req) => req.path === '/api/health',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos de login. Intenta en 15 minutos.' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'"],
      imgSrc:     ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc:    ["'self'"],
      objectSrc:  ["'none'"],
      frameSrc:   ["'none'"],
      baseUri:    ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy:            { policy: 'strict-origin-when-cross-origin' },
}));

app.use('/uploads', express.static(uploadsDir));
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:4173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({ origin: allowedOrigins }));

// Raw body para webhook de Stripe — DEBE ir antes de express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use((req, _res, next) => { req.prisma = prisma; next(); });

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

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
app.get('/health',     (_req, res) => res.status(200).json({ status: 'ok' }));

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

// ── HTTP request logging ───────────────────────────────────────────────────────
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

app.use((err, _req, res, _next) => {
  logger.error({ err }, 'unhandled error');
  res.status(500).json({ error: 'Error interno del servidor' });
});

const server = http.createServer(app);

module.exports = { app, server };
