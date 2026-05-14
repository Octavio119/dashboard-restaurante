const logger = require('../lib/logger');
const router = require('express').Router();
const requireAuth     = require('../middleware/auth');
const verifyRole      = require('../middleware/verifyRole');
const verifyAdminCode = require('../middleware/verifyAdminCode');
const { audit }       = require('../lib/audit');
const { createVentaConTicket } = require('../lib/ventaHelper');
const { toDate, fromFilter }   = require('../lib/dateUtils');
const { emit: socketEmit }     = require('../lib/socket');

router.use(requireAuth);
router.use(require('../middleware/requireTenant'));

const RID = (req) => req.user.restaurante_id;
const VALID_METODOS = ['efectivo', 'tarjeta', 'transferencia', 'qr', 'paypal'];

function formatVenta(v) {
  return {
    ...v,
    items: (v.venta_items || []).map(i => ({
      nombre:          i.nombre,
      qty:             i.qty,
      precio_unitario: i.precio_unitario,
      producto_id:     i.producto_id,
    })),
  };
}

// POST /api/ventas
router.post('/', async (req, res) => {
  try {
    const { items, total, metodo_pago, fecha, skipStock } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'items requerido (array)' });
    if (total == null || isNaN(total)) return res.status(400).json({ error: 'total requerido' });
    if (!metodo_pago) return res.status(400).json({ error: 'metodo_pago requerido' });
    if (!VALID_METODOS.includes(metodo_pago))
      return res.status(400).json({ error: `metodo_pago debe ser: ${VALID_METODOS.join(', ')}` });

    const rid = RID(req);
    const fechaVenta = fecha || new Date().toISOString().split('T')[0];
    const cfg = await req.prisma.configNegocio.findUnique({ where: { restaurante_id: rid } }) || {};
    const taxRate   = cfg.tax_rate ?? 19;
    const impActivo = cfg.impuesto_activo != null ? Boolean(cfg.impuesto_activo) : true;

    const subtotalCalc = parseFloat(items.reduce((acc, i) => acc + ((i.precio_unit || i.precio_unitario || 0) * (i.qty || 0)), 0).toFixed(2));
    const taxAmount    = impActivo ? parseFloat((subtotalCalc * taxRate / 100).toFixed(2)) : 0;
    const totalCalc    = parseFloat((subtotalCalc + taxAmount).toFixed(2));

    const itemsConProducto = (items || []).filter(i => i.producto_id);
    if (itemsConProducto.length > 0 && !skipStock) {
      for (const item of itemsConProducto) {
        const prod = await req.prisma.producto.findFirst({
          where: { id: item.producto_id, restaurante_id: rid, activo: true },
        });
        if (!prod) return res.status(404).json({ error: `Producto ${item.producto_id} no encontrado` });
        if (prod.stock < item.qty)
          return res.status(409).json({ error: `Stock insuficiente: "${prod.nombre}" (disponible: ${prod.stock}, solicitado: ${item.qty})` });
      }
    }

    const venta = await createVentaConTicket(
      req.prisma,
      { subtotal: subtotalCalc, total: totalCalc, metodo_pago, cajero: req.user.nombre, restaurante_id: rid },
      cfg, fechaVenta, rid,
    );

    // Crear VentaItems y descontar stock en una transacción
    const ventaItemsData = items.map(i => ({
      venta_id:        venta.id,
      nombre:          i.nombre || '',
      qty:             i.qty || 1,
      precio_unitario: i.precio_unitario || i.precio_unit || 0,
      producto_id:     i.producto_id || null,
      restaurante_id:  rid,
    }));

    const stockOps = itemsConProducto.length > 0 && !skipStock
      ? itemsConProducto.flatMap(item => [
          req.prisma.producto.update({ where: { id: item.producto_id }, data: { stock: { decrement: item.qty } } }),
          req.prisma.inventarioMovimiento.create({
            data: { producto_id: item.producto_id, usuario_id: req.user.id, tipo: 'salida', cantidad: item.qty, motivo: `Venta: ${venta.ticket_id}`, restaurante_id: rid },
          }),
        ])
      : [];

    await req.prisma.$transaction([
      req.prisma.ventaItem.createMany({ data: ventaItemsData }),
      ...stockOps,
    ]);

    socketEmit(rid, 'venta:realizada', {
      ticket_id:   venta.ticket_id,
      total:       venta.total,
      metodo_pago: venta.metodo_pago,
      cajero:      venta.cajero,
      fecha:       venta.fecha,
      items_count: items.length,
    });

    res.status(201).json({
      ticket_id:       venta.ticket_id,
      fecha:           venta.fecha,
      hora:            new Date(venta.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      restaurante:     cfg.nombre    || 'Mi Restaurante',
      rut:             cfg.rut       || '',
      direccion:       cfg.direccion || '',
      logo_url:        cfg.logo_url  || '',
      items,
      subtotal:        venta.subtotal,
      tax_rate:        taxRate,
      tax_amount:      taxAmount,
      impuesto_activo: impActivo,
      total:           venta.total,
      metodo_pago:     venta.metodo_pago,
      cajero:          venta.cajero,
    });
  } catch (err) { logger.error({ err }, 'route error'); res.status(500).json({ error: 'Error al registrar venta' }); }
});

// GET /api/ventas?fecha=YYYY-MM-DD&page=1&limit=50
router.get('/', async (req, res) => {
  try {
    const fecha    = req.query.fecha || new Date().toISOString().split('T')[0];
    const page     = Math.max(1, parseInt(req.query.page)  || 1);
    const limit    = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip     = (page - 1) * limit;
    const where    = { fecha: toDate(fecha), restaurante_id: RID(req) };

    const [ventas, total] = await Promise.all([
      req.prisma.venta.findMany({ where, include: { venta_items: true }, orderBy: { id: 'desc' }, take: limit, skip }),
      req.prisma.venta.count({ where }),
    ]);
    res.json({ rows: ventas.map(formatVenta), total, page, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: 'Error al obtener ventas' }); }
});

// GET /api/ventas/analytics
router.get('/analytics', async (req, res) => {
  try {
    const rid   = RID(req);
    const hoy   = new Date().toISOString().split('T')[0];
    const ayer  = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const fecha30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const [aggHoy, aggAyer, horaRows, topRows] = await Promise.all([
      req.prisma.venta.aggregate({
        where: { fecha: toDate(hoy), restaurante_id: rid },
        _sum: { total: true }, _count: { id: true },
      }),
      req.prisma.venta.aggregate({
        where: { fecha: toDate(ayer), restaurante_id: rid },
        _sum: { total: true }, _count: { id: true },
      }),
      req.prisma.$queryRaw`
        SELECT TO_CHAR(created_at AT TIME ZONE 'America/Santiago', 'HH24') || ':00' AS hour,
               COUNT(*)::int AS orders
        FROM "Venta"
        WHERE restaurante_id = ${rid}
          AND fecha = ${toDate(hoy)}
        GROUP BY hour ORDER BY hour
      `,
      req.prisma.$queryRaw`
        SELECT vi.nombre AS name, SUM(vi.qty)::int AS sales
        FROM "VentaItem" vi
        JOIN "Venta" v ON v.id = vi.venta_id
        WHERE vi.restaurante_id = ${rid}
          AND v.fecha >= ${toDate(fecha30)}
          AND vi.nombre IS NOT NULL AND vi.nombre <> ''
        GROUP BY vi.nombre
        ORDER BY sales DESC
        LIMIT 5
      `,
    ]);

    const totalHoy   = aggHoy._sum.total   ?? 0;
    const totalAyer  = aggAyer._sum.total  ?? 0;
    const cantidadHoy  = aggHoy._count.id  ?? 0;
    const cantidadAyer = aggAyer._count.id ?? 0;
    const comparacionPct = totalAyer > 0 ? parseFloat((((totalHoy - totalAyer) / totalAyer) * 100).toFixed(1)) : null;

    res.json({
      total_hoy:            parseFloat(totalHoy.toFixed(2)),
      total_ayer:           parseFloat(totalAyer.toFixed(2)),
      cantidad_hoy:         cantidadHoy,
      cantidad_ayer:        cantidadAyer,
      ticket_promedio_hoy:  parseFloat((cantidadHoy  ? totalHoy  / cantidadHoy  : 0).toFixed(2)),
      ticket_promedio_ayer: parseFloat((cantidadAyer ? totalAyer / cantidadAyer : 0).toFixed(2)),
      comparacion_pct:      comparacionPct,
      ventas_por_hora:      horaRows.map(r => ({ hour: r.hour, orders: Number(r.orders) })),
      top_productos:        topRows.map(r => ({ name: r.name, sales: Number(r.sales) })),
    });
  } catch (err) { logger.error({ err }, 'route error'); res.status(500).json({ error: 'Error al obtener analytics' }); }
});

// GET /api/ventas/resumen?periodo=dia|semana|mes
router.get('/resumen', async (req, res) => {
  try {
    const { periodo = 'dia' } = req.query;
    const rid = RID(req);
    const hoy = new Date();
    let fechaDesde;
    if (periodo === 'dia') { fechaDesde = hoy.toISOString().split('T')[0]; }
    else if (periodo === 'semana') { const d = new Date(hoy); d.setDate(d.getDate() - 7); fechaDesde = d.toISOString().split('T')[0]; }
    else { const d = new Date(hoy); d.setDate(d.getDate() - 30); fechaDesde = d.toISOString().split('T')[0]; }

    const where = periodo === 'dia'
      ? { fecha: toDate(fechaDesde), restaurante_id: rid }
      : { fecha: fromFilter(fechaDesde), restaurante_id: rid };

    const [agg, byMetodo] = await Promise.all([
      req.prisma.venta.aggregate({ where, _sum: { total: true }, _count: { id: true } }),
      req.prisma.venta.groupBy({ by: ['metodo_pago'], where, _sum: { total: true } }),
    ]);

    const por_metodo = {};
    for (const row of byMetodo) por_metodo[row.metodo_pago] = row._sum.total ?? 0;

    res.json({
      cantidad: agg._count.id ?? 0,
      total:    parseFloat((agg._sum.total ?? 0).toFixed(2)),
      por_metodo,
    });
  } catch (err) { res.status(500).json({ error: 'Error al obtener resumen' }); }
});

// DELETE /api/ventas/:id
router.delete('/:id', verifyRole('admin'), verifyAdminCode, async (req, res) => {
  try {
    const venta = await req.prisma.venta.findFirst({ where: { id: parseInt(req.params.id), restaurante_id: RID(req) } });
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
    await req.prisma.venta.delete({ where: { id: venta.id } });
    await audit(req, 'DELETE_VENTA', 'Venta', venta.id, { ticket_id: venta.ticket_id, total: venta.total });
    res.json({ ok: true });
  } catch (err) { logger.error({ err }, 'route error'); res.status(500).json({ error: 'Error al eliminar venta' }); }
});

module.exports = router;
