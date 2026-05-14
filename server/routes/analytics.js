const https       = require('https');
const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const { checkPlanFeature } = require('../lib/planLimits');
const cache       = require('../lib/cache');
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

// ─── AI Insights helpers ──────────────────────────────────────────────────────

const DOW_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const INSIGHTS_TTL = 6 * 60 * 60; // 6 hours

/** Call Anthropic Messages API, return parsed JSON from assistant text. */
async function _callAnthropic(prompt) {
  const body = JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (res.statusCode !== 200) {
            return reject(new Error(parsed.error?.message || `Anthropic ${res.statusCode}`));
          }
          const text = parsed.content?.[0]?.text || '';
          // Strip optional markdown fences
          const json = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
          resolve(JSON.parse(json));
        } catch (e) {
          reject(new Error('Respuesta inválida de Anthropic: ' + e.message));
        }
      });
    });
    req.setTimeout(28_000, () => { req.destroy(); reject(new Error('Anthropic timeout')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/** Rule-based insights when no API key is configured. */
function _staticInsights({ salesByDay, topProducts, peakHour, avgTicket }) {
  const insights = [];

  // Weakest day of the week
  if (salesByDay.length >= 3) {
    const avg = salesByDay.reduce((s, d) => s + Number(d.total), 0) / salesByDay.length;
    const worst = salesByDay.reduce((a, b) => Number(a.total) < Number(b.total) ? a : b);
    const pct = avg > 0 ? Math.round((1 - Number(worst.total) / avg) * 100) : 0;
    if (pct >= 25) {
      insights.push({
        type: 'warning',
        title: `Ventas bajas los ${DOW_NAMES[worst.dow]}`,
        description: `Las ventas del ${DOW_NAMES[worst.dow]} están un ${pct}% por debajo del promedio semanal.`,
        action: `Lanza una promo exclusiva para los ${DOW_NAMES[worst.dow]} — combo, 2×1 o descuento para grupos.`,
      });
    }
  }

  // Peak hour opportunity
  if (peakHour) {
    const h = Number(peakHour.hour);
    insights.push({
      type: 'trend',
      title: `Hora pico: ${h}:00 – ${h + 1}:00`,
      description: `Tu restaurante concentra la mayor actividad entre las ${h}:00 y las ${h + 1}:00 con ${peakHour.count} pedidos en promedio.`,
      action: 'Asegura staff completo y mise en place lista al menos 30 min antes de ese horario.',
    });
  }

  // Top product
  const top = topProducts[0];
  if (top) {
    insights.push({
      type: 'opportunity',
      title: `"${top.nombre}" domina las ventas`,
      description: `Es tu producto más vendido este mes con ${top.unidades} unidades. Aprovéchalo como ancla de menú.`,
      action: 'Colócalo en el inicio del menú y úsalo en fotos para redes sociales para potenciar la conversión.',
    });
  }

  // Ticket average
  if (insights.length < 3 && avgTicket) {
    const formatted = Math.round(avgTicket).toLocaleString('es-CL');
    insights.push({
      type: 'opportunity',
      title: `Ticket promedio: $${formatted}`,
      description: `El valor promedio por pedido la última semana fue $${formatted}.`,
      action: 'Ofrece postres o bebidas al momento del cierre de cuenta para aumentar el ticket sin fricción.',
    });
  }

  return insights.slice(0, 3);
}

// ─── GET /api/analytics/insights ─────────────────────────────────────────────
router.get('/insights', async (req, res) => {
  const rid      = RID(req);
  const forceRefresh = req.query.refresh === 'true';
  const cacheKey = `ai-insights:${rid}`;

  try {
    // ── Cache read ────────────────────────────────────────────────────────────
    if (!forceRefresh) {
      const cached = await cache.get(cacheKey);
      if (cached) return res.json({ ...cached, from_cache: true });
    } else {
      await cache.del(cacheKey);
    }

    // ── Data queries (parallel) ───────────────────────────────────────────────
    const now       = new Date();
    const from90    = new Date(now); from90.setDate(now.getDate() - 90); from90.setHours(0, 0, 0, 0);
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endPrevMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const startLastWeek  = new Date(now); startLastWeek.setDate(now.getDate() - 7); startLastWeek.setHours(0, 0, 0, 0);

    const [salesByDayRaw, peakHourRaw, currentItems, prevItems, ticketAgg] = await Promise.all([
      // Sales by day of week (0=Sun … 6=Sat)
      req.prisma.$queryRaw`
        SELECT EXTRACT(DOW FROM fecha)::int AS dow,
               COUNT(*)::int               AS count,
               SUM(total)                  AS total
        FROM "Venta"
        WHERE restaurante_id = ${rid}
          AND fecha >= ${from90}
        GROUP BY dow
        ORDER BY dow
      `,
      // Peak hour
      req.prisma.$queryRaw`
        SELECT EXTRACT(HOUR FROM fecha)::int AS hour,
               COUNT(*)::int                 AS count
        FROM "Venta"
        WHERE restaurante_id = ${rid}
          AND fecha >= ${from90}
        GROUP BY hour
        ORDER BY count DESC
        LIMIT 1
      `,
      // Top products this month
      req.prisma.ventaItem.findMany({
        where: { restaurante_id: rid, venta: { fecha: { gte: startMonth, lte: now } } },
        select: { nombre: true, qty: true },
      }),
      // Top products previous month
      req.prisma.ventaItem.findMany({
        where: { restaurante_id: rid, venta: { fecha: { gte: startPrevMonth, lte: endPrevMonth } } },
        select: { nombre: true, qty: true },
      }),
      // Average ticket last 7 days
      req.prisma.venta.aggregate({
        where: { restaurante_id: rid, fecha: { gte: startLastWeek } },
        _avg: { total: true },
        _count: { id: true },
      }),
    ]);

    // ── Aggregate products ────────────────────────────────────────────────────
    const aggProducts = (items) => {
      const map = {};
      for (const i of items) {
        map[i.nombre] = (map[i.nombre] || 0) + i.qty;
      }
      return Object.entries(map)
        .map(([nombre, unidades]) => ({ nombre, unidades }))
        .sort((a, b) => b.unidades - a.unidades)
        .slice(0, 5);
    };

    const topCurrent  = aggProducts(currentItems);
    const topPrev     = aggProducts(prevItems);
    const peakHour    = peakHourRaw[0] || null;
    const avgTicket   = ticketAgg._avg.total || 0;
    const salesByDay  = salesByDayRaw;

    // ── Build response payload ────────────────────────────────────────────────
    let insights;
    let source = 'static';

    if (process.env.ANTHROPIC_API_KEY) {
      // ── Build prompt ────────────────────────────────────────────────────────
      const dowTable = DOW_NAMES.map((name, i) => {
        const d = salesByDay.find(r => r.dow === i);
        return d
          ? `  ${name}: $${Number(d.total).toFixed(0)} (${d.count} ventas)`
          : `  ${name}: sin datos`;
      }).join('\n');

      const topTable = topCurrent.map((p, idx) => {
        const prev = topPrev.find(x => x.nombre === p.nombre);
        const diff = prev ? ` (mes anterior: ${prev.unidades} uds)` : ' (sin datos mes anterior)';
        return `  ${idx + 1}. ${p.nombre}: ${p.unidades} uds${diff}`;
      }).join('\n') || '  Sin ventas este mes';

      const prompt = `Eres un experto en analytics para restaurantes latinoamericanos. Analiza estos datos reales y genera exactamente 3 insights accionables.

DATOS DEL RESTAURANTE (últimos 90 días):

Ventas por día de semana:
${dowTable}

Top 5 productos más vendidos este mes:
${topTable}

Hora pico de pedidos: ${peakHour ? `${peakHour.hour}:00 – ${Number(peakHour.hour) + 1}:00 (${peakHour.count} pedidos)` : 'sin datos'}

Ticket promedio última semana: $${Math.round(avgTicket).toLocaleString('es-CL')} (${ticketAgg._count.id} pedidos)

REGLAS:
- Exactamente 3 insights. No más, no menos.
- Usa números reales del dataset en la descripción.
- "action" debe ser concreta (1-2 oraciones), no genérica.
- type: "warning" = problema urgente, "opportunity" = potencial sin explotar, "trend" = patrón identificado.
- Idioma: español latinoamericano, informal y directo.

Responde ÚNICAMENTE con JSON válido sin markdown:
{"insights":[{"type":"...","title":"...","description":"...","action":"..."},{"type":"...","title":"...","description":"...","action":"..."},{"type":"...","title":"...","description":"...","action":"..."}]}`;

      try {
        const aiResponse = await _callAnthropic(prompt);
        if (Array.isArray(aiResponse.insights) && aiResponse.insights.length > 0) {
          insights = aiResponse.insights.slice(0, 3);
          source   = 'ai';
        } else {
          throw new Error('Estructura de respuesta inesperada');
        }
      } catch (aiErr) {
        logger.warn({ err: aiErr }, 'AI insights fallback to static');
        insights = _staticInsights({ salesByDay, topProducts: topCurrent, peakHour, avgTicket });
      }
    } else {
      insights = _staticInsights({ salesByDay, topProducts: topCurrent, peakHour, avgTicket });
    }

    const payload = {
      insights,
      source,
      generated_at: new Date().toISOString(),
      data_summary: {
        ventas_semana: salesByDay,
        top_productos: topCurrent,
        hora_pico: peakHour,
        ticket_promedio: avgTicket,
        pedidos_semana: ticketAgg._count.id,
      },
    };

    await cache.set(cacheKey, payload, INSIGHTS_TTL);
    res.json({ ...payload, from_cache: false });
  } catch (e) {
    logger.error({ err: e }, 'analytics/insights error');
    res.status(500).json({ error: 'Error al generar insights' });
  }
});

module.exports = router;
