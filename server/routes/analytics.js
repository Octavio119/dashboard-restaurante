const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const { checkPlanFeature } = require('../lib/planLimits');

router.use(requireAuth);
router.use(checkPlanFeature('analytics'));

// GET /api/analytics/ventas
router.get('/ventas', async (req, res) => {
  try {
    const rid  = req.user.restaurante_id;
    const from = req.query.from ? new Date(req.query.from) : new Date(new Date().setDate(1));
    const to   = req.query.to   ? new Date(req.query.to)   : new Date();

    const ventas = await req.prisma.venta.findMany({
      where:   { restaurante_id: rid, fecha: { gte: from, lte: to } },
      select:  { total: true, metodo_pago: true, fecha: true },
      orderBy: { fecha: 'asc' },
    });

    const total      = ventas.reduce((s, v) => s + v.total, 0);
    const por_metodo = ventas.reduce((acc, v) => {
      acc[v.metodo_pago] = (acc[v.metodo_pago] || 0) + v.total;
      return acc;
    }, {});

    res.json({ total, cantidad: ventas.length, por_metodo, ventas });
  } catch (e) {
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
