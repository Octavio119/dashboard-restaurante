const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const { checkPlanFeature } = require('../lib/planLimits');
const logger      = require('../lib/logger');

const RID = (req) => req.user.restaurante_id;

router.use(requireAuth);
router.use(checkPlanFeature('analytics'));

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns { from, to } Date objects based on a periodo string.
 * periodo: 'semana' | 'mes' | 'año'  (default: 'mes')
 */
function dateRangeFromPeriodo(periodo) {
  const to   = new Date();
  const from = new Date();

  switch (periodo) {
    case 'semana':
      from.setDate(from.getDate() - 6);
      break;
    case 'año':
      from.setFullYear(from.getFullYear() - 1);
      from.setDate(1);
      from.setMonth(0);
      break;
    case 'mes':
    default:
      from.setDate(1);
      break;
  }

  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

/**
 * Returns the Monday (start) and Sunday (end) of the ISO week that contains `date`.
 */
function getWeekBounds(date) {
  const d     = new Date(date);
  const day   = d.getDay();                        // 0 = Sun … 6 = Sat
  const diff  = (day === 0 ? -6 : 1 - day);       // shift to Monday
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// ─── GET /api/analytics/ventas ───────────────────────────────────────────────
router.get('/ventas', async (req, res) => {
  try {
    const rid  = RID(req);
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
    logger.error({ err: e }, 'analytics/ventas error');
    res.status(500).json({ error: 'Error interno' });
  }
});

// ─── GET /api/analytics/productos?periodo=semana|mes|año ─────────────────────
// Top 10 products by units sold and revenue within the given period.
router.get('/productos', async (req, res) => {
  try {
    const rid              = RID(req);
    const { from, to }     = dateRangeFromPeriodo(req.query.periodo);

    // Pull every VentaItem whose parent Venta falls inside the date range
    const items = await req.prisma.ventaItem.findMany({
      where: {
        restaurante_id: rid,
        venta: { fecha: { gte: from, lte: to } },
      },
      select: { nombre: true, qty: true, precio_unitario: true },
    });

    // Aggregate by product name
    const map = {};
    for (const item of items) {
      const key = item.nombre;
      if (!map[key]) map[key] = { nombre: key, unidades_vendidas: 0, total_generado: 0 };
      map[key].unidades_vendidas += item.qty;
      map[key].total_generado    += item.qty * item.precio_unitario;
    }

    const result = Object.values(map)
      .sort((a, b) => b.unidades_vendidas - a.unidades_vendidas)
      .slice(0, 10);

    res.json(result);
  } catch (e) {
    logger.error({ err: e }, 'analytics/productos error');
    res.status(500).json({ error: 'Error interno' });
  }
});

// ─── GET /api/analytics/horas?fecha=YYYY-MM-DD ───────────────────────────────
// Sales grouped by hour of day (0-23). Missing hours return 0.
router.get('/horas', async (req, res) => {
  try {
    const rid = RID(req);

    // Default to today
    const dateStr = req.query.fecha || new Date().toISOString().slice(0, 10);
    const from    = new Date(`${dateStr}T00:00:00.000`);
    const to      = new Date(`${dateStr}T23:59:59.999`);

    const ventas = await req.prisma.venta.findMany({
      where:  { restaurante_id: rid, fecha: { gte: from, lte: to } },
      select: { total: true, fecha: true },
    });

    // Build a 24-slot map initialised to zero
    const hoursMap = {};
    for (let h = 0; h < 24; h++) {
      const label      = `${String(h).padStart(2, '0')}:00`;
      hoursMap[label]  = { hora: label, ventas: 0, total: 0 };
    }

    for (const v of ventas) {
      const hour  = new Date(v.fecha).getHours();
      const label = `${String(hour).padStart(2, '0')}:00`;
      hoursMap[label].ventas += 1;
      hoursMap[label].total  += v.total;
    }

    res.json(Object.values(hoursMap));
  } catch (e) {
    logger.error({ err: e }, 'analytics/horas error');
    res.status(500).json({ error: 'Error interno' });
  }
});

// ─── GET /api/analytics/comparativa?semanas=2 ────────────────────────────────
// Compares current ISO week vs the previous one.
// semanas param is accepted but only the 2-week comparison is implemented
// (extending to N weeks is straightforward if needed).
router.get('/comparativa', async (req, res) => {
  try {
    const rid = RID(req);

    const now            = new Date();
    const currentWeek    = getWeekBounds(now);

    // Previous week: 7 days before the start of current week
    const prevWeekAnchor = new Date(currentWeek.start);
    prevWeekAnchor.setDate(prevWeekAnchor.getDate() - 1);
    const previousWeek   = getWeekBounds(prevWeekAnchor);

    // Fetch both weeks in parallel
    const [ventasActual, ventasAnterior] = await Promise.all([
      req.prisma.venta.findMany({
        where:  { restaurante_id: rid, fecha: { gte: currentWeek.start, lte: currentWeek.end } },
        select: { total: true, fecha: true },
      }),
      req.prisma.venta.findMany({
        where:  { restaurante_id: rid, fecha: { gte: previousWeek.start, lte: previousWeek.end } },
        select: { total: true, fecha: true },
      }),
    ]);

    /**
     * Aggregates a flat Venta array into the { total, ordenes, dias } shape.
     * `weekStart` is the Monday Date of the week being processed.
     */
    function aggregateWeek(ventas, weekStart) {
      // Initialise all 7 days
      const diasMap = {};
      for (let i = 0; i < 7; i++) {
        const d     = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        const label = DAY_LABELS[d.getDay()];
        diasMap[label] = { fecha: label, total: 0, ordenes: 0 };
      }

      let total   = 0;
      let ordenes = 0;

      for (const v of ventas) {
        const label = DAY_LABELS[new Date(v.fecha).getDay()];
        if (diasMap[label]) {
          diasMap[label].total   += v.total;
          diasMap[label].ordenes += 1;
        }
        total   += v.total;
        ordenes += 1;
      }

      const dias = Object.values(diasMap);
      return { total, ordenes, dias };
    }

    const semana_actual   = aggregateWeek(ventasActual,   currentWeek.start);
    const semana_anterior = aggregateWeek(ventasAnterior, previousWeek.start);

    // Percentage change: avoid division-by-zero when previous week had no sales
    const variacion_pct =
      semana_anterior.total === 0
        ? null
        : Math.round(
            ((semana_actual.total - semana_anterior.total) / semana_anterior.total) * 1000
          ) / 10; // one decimal place

    res.json({ semana_actual, semana_anterior, variacion_pct });
  } catch (e) {
    logger.error({ err: e }, 'analytics/comparativa error');
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
