const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const { toDate } = require('../lib/dateUtils');

router.use(requireAuth);
router.use(require('../middleware/requireTenant'));

const RID = (req) => req.user.restaurante_id;

// GET /api/caja/hoy
router.get('/hoy', async (req, res) => {
  try {
    const fechaStr = new Date().toISOString().split('T')[0];
    const caja = await req.prisma.caja.findUnique({
      where: { fecha_restaurante_id: { fecha: toDate(fechaStr), restaurante_id: RID(req) } },
    });
    res.json(caja || null);
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/caja/abrir
router.post('/abrir', async (req, res) => {
  try {
    const { monto_inicial } = req.body;
    if (monto_inicial == null || isNaN(monto_inicial) || monto_inicial < 0)
      return res.status(400).json({ error: 'monto_inicial requerido (número >= 0)' });

    const fechaStr = new Date().toISOString().split('T')[0];
    const rid   = RID(req);
    const fechaDate = toDate(fechaStr);

    const existente = await req.prisma.caja.findUnique({
      where: { fecha_restaurante_id: { fecha: fechaDate, restaurante_id: rid } },
    });
    if (existente) return res.status(409).json({ error: 'Ya existe una caja para hoy', caja: existente });

    const caja = await req.prisma.caja.create({
      data: { fecha: fechaDate, restaurante_id: rid, monto_inicial: parseFloat(monto_inicial), cajero_apertura: req.user.nombre, estado: 'abierta' },
    });
    res.status(201).json(caja);
  } catch (e) { console.error(e); res.status(500).json({ error: 'No se pudo abrir la caja' }); }
});

// POST /api/caja/cerrar
router.post('/cerrar', async (req, res) => {
  try {
    const { monto_final } = req.body;
    if (monto_final == null || isNaN(monto_final) || monto_final < 0)
      return res.status(400).json({ error: 'monto_final requerido (número >= 0)' });

    const fechaStr = new Date().toISOString().split('T')[0];
    const rid   = RID(req);
    const fechaDate = toDate(fechaStr);

    const caja = await req.prisma.caja.findFirst({
      where: { fecha: fechaDate, restaurante_id: rid, estado: 'abierta' },
    });
    if (!caja) return res.status(404).json({ error: 'No hay caja abierta hoy' });

    const ventas = await req.prisma.venta.findMany({
      where: { fecha: fechaDate, restaurante_id: rid },
      select: { total: true, metodo_pago: true },
    });

    const total_ventas   = parseFloat(ventas.reduce((s, v) => s + v.total, 0).toFixed(2));
    const total_efectivo = parseFloat(ventas.filter(v => v.metodo_pago === 'efectivo').reduce((s, v) => s + v.total, 0).toFixed(2));
    const esperado       = parseFloat((caja.monto_inicial + total_efectivo).toFixed(2));
    const diferencia     = parseFloat((parseFloat(monto_final) - esperado).toFixed(2));

    const cajaActualizada = await req.prisma.caja.update({
      where: { id: caja.id },
      data: {
        monto_final:    parseFloat(monto_final),
        total_ventas,
        total_efectivo,
        diferencia,
        cajero_cierre:  req.user.nombre,
        estado:         'cerrada',
        closed_at:      new Date(),
      },
    });
    res.json(cajaActualizada);
  } catch (e) { console.error(e); res.status(500).json({ error: 'No se pudo cerrar la caja' }); }
});

module.exports = router;
