const logger = require('../lib/logger');
const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const requireAuth = require('../middleware/auth');
const verifyRole  = require('../middleware/verifyRole');
const r2      = require('../lib/r2');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.use(requireAuth);
router.use(require('../middleware/requireTenant'));

const RID = (req) => req.user.restaurante_id;

function parseRow(row) {
  if (!row) return null;
  try { row.payment_methods = JSON.parse(row.payment_methods); } catch { row.payment_methods = {}; }
  return row;
}

// GET /api/config
router.get('/', async (req, res) => {
  try {
    const rid = RID(req);
    let row = await req.prisma.configNegocio.findUnique({ where: { restaurante_id: rid } });
    if (!row) {
      row = await req.prisma.configNegocio.create({ data: { restaurante_id: rid } });
    }
    res.json(parseRow({ ...row }));
  } catch (e) { logger.error({ err: e }, 'route error'); res.status(500).json({ error: 'Error interno' }); }
});

// PUT /api/config
router.put('/', verifyRole('admin', 'gerente'), async (req, res) => {
  try {
    const rid = RID(req);
    const {
      nombre, rut, direccion, currency, currency_code,
      open_time, close_time, tax_rate, payment_methods,
      timezone, idioma, formato_fecha, prefijo_ticket,
      numero_inicial, impuesto_activo, logo_url,
    } = req.body;

    if (tax_rate != null && (isNaN(tax_rate) || tax_rate < 0 || tax_rate > 100))
      return res.status(400).json({ error: 'tax_rate debe ser entre 0 y 100' });

    const data = {};
    if (nombre        != null) data.nombre        = nombre;
    if (rut           != null) data.rut           = rut;
    if (direccion     != null) data.direccion     = direccion;
    if (currency      != null) data.currency      = currency;
    if (currency_code != null) data.currency_code = currency_code;
    if (open_time     != null) data.open_time     = open_time;
    if (close_time    != null) data.close_time    = close_time;
    if (tax_rate      != null) data.tax_rate      = parseFloat(tax_rate);
    if (payment_methods != null) data.payment_methods = JSON.stringify(payment_methods);
    if (timezone      != null) data.timezone      = timezone;
    if (idioma        != null) data.idioma        = idioma;
    if (formato_fecha != null) data.formato_fecha = formato_fecha;
    if (prefijo_ticket  != null) data.prefijo_ticket  = prefijo_ticket;
    if (numero_inicial  != null) data.numero_inicial  = parseInt(numero_inicial);
    if (impuesto_activo != null) data.impuesto_activo = Boolean(impuesto_activo);
    if (logo_url        != null) data.logo_url        = logo_url;

    const row = await req.prisma.configNegocio.upsert({
      where:  { restaurante_id: rid },
      update: data,
      create: { restaurante_id: rid, ...data },
    });
    res.json(parseRow({ ...row }));
  } catch (e) { logger.error({ err: e }, 'route error'); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/config/logo
router.post('/logo', verifyRole('admin', 'gerente'), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo de imagen' });

    if (!r2.isConfigured()) {
      return res.status(503).json({ error: 'Almacenamiento de imágenes no configurado. Contacta al administrador.' });
    }

    const rid = RID(req);
    const fileExt = path.extname(req.file.originalname);
    const key = `logos/${rid}/logo-${rid}-${Date.now()}${fileExt}`;

    const publicUrl = await r2.upload(key, req.file.buffer, req.file.mimetype);

    await req.prisma.configNegocio.upsert({
      where:  { restaurante_id: rid },
      update: { logo_url: publicUrl },
      create: { restaurante_id: rid, logo_url: publicUrl },
    });

    res.json({ logoUrl: publicUrl });
  } catch (e) {
    logger.error({ err: e }, 'logo upload error');
    res.status(500).json({ error: 'Error al subir la imagen a la nube' });
  }
});

module.exports = router;
