const router = require('express').Router();
const requireAuth     = require('../middleware/auth');
const verifyRole      = require('../middleware/verifyRole');
const verifyAdminCode = require('../middleware/verifyAdminCode');
const { getIO }       = require('../lib/socket');
const { sendStockAlert } = require('../lib/mailer');
const { createVentaConTicket } = require('../lib/ventaHelper');
const { toDate, fromFilter }   = require('../lib/dateUtils');

router.use(requireAuth);
router.use(require('../middleware/requireTenant'));

const RID = (req) => req.user.restaurante_id;
const VALID_METODOS = ['efectivo', 'tarjeta', 'transferencia', 'qr'];

async function getNextNumero(prisma, rid) {
  const result = await prisma.$queryRaw`
    SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(numero, '#ORD-', '') AS INTEGER)), 7281) AS max_num
    FROM "Pedido"
    WHERE restaurante_id = ${rid}
    AND numero ~ '^#ORD-[0-9]+$'
  `;
  const maxNum = Number(result[0]?.max_num ?? 7281);
  return `#ORD-${maxNum + 1}`;
}

// GET /api/pedidos?fecha=|periodo=
router.get('/', async (req, res) => {
  try {
    const { fecha, periodo } = req.query;
    const rid = RID(req);
    const hoy = new Date().toISOString().split('T')[0];
    let where = { restaurante_id: rid };

    if (fecha)               where.fecha = toDate(fecha);
    else if (periodo === 'semana') { const d = new Date(); d.setDate(d.getDate() - 7); where.fecha = fromFilter(d.toISOString().split('T')[0]); }
    else if (periodo === 'mes')    { const d = new Date(); d.setDate(d.getDate() - 30); where.fecha = fromFilter(d.toISOString().split('T')[0]); }
    else                     where.fecha = toDate(hoy);

    const rows = await req.prisma.pedido.findMany({ where, include: { pedido_items: { orderBy: { id: 'asc' } } }, orderBy: { id: 'desc' } });
    res.json(rows.map(p => ({ ...p, items: p.pedido_items })));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error interno' }); }
});

// GET /api/pedidos/ventas?periodo=dia|semana|mes
router.get('/ventas', async (req, res) => {
  try {
    const { periodo = 'dia' } = req.query;
    const rid = RID(req);
    let where = { restaurante_id: rid, estado: { not: 'cancelado' } };
    const hoy = new Date().toISOString().split('T')[0];

    if (periodo === 'dia')    where.fecha = toDate(hoy);
    else if (periodo === 'semana') { const d = new Date(); d.setDate(d.getDate() - 7); where.fecha = fromFilter(d.toISOString().split('T')[0]); }
    else                     { const d = new Date(); d.setDate(d.getDate() - 30); where.fecha = fromFilter(d.toISOString().split('T')[0]); }

    const agg = await req.prisma.pedido.aggregate({ where, _sum: { total: true } });
    res.json({ total: agg._sum.total ?? 0 });
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// GET /api/pedidos/por-mesa
router.get('/por-mesa', async (req, res) => {
  try {
    const rid = RID(req);
    const rows = await req.prisma.pedido.findMany({
      where: { restaurante_id: rid, estado: { notIn: ['confirmado', 'cancelado'] }, mesa: { not: '' } },
      include: { pedido_items: { orderBy: { id: 'asc' } } },
      orderBy: [{ mesa: 'asc' }, { id: 'asc' }],
    });
    const mesaMap = {};
    for (const p of rows) {
      if (!mesaMap[p.mesa]) mesaMap[p.mesa] = [];
      mesaMap[p.mesa].push({ ...p, items: p.pedido_items });
    }
    res.json(Object.entries(mesaMap).map(([mesa, pedidos]) => ({ mesa, pedidos })));
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/pedidos
router.post('/', verifyRole('admin', 'staff', 'chef', 'gerente'), async (req, res) => {
  try {
    const { cliente_nombre, items, item, total, estado = 'pendiente', fecha, reserva_id, mesa, personas } = req.body;
    if (!cliente_nombre) return res.status(400).json({ error: 'cliente_nombre requerido' });

    const rid = RID(req);
    const numero = await getNextNumero(req.prisma, rid);
    const fechaStr = fecha || new Date().toISOString().split('T')[0];
    const fechaHoy = toDate(fechaStr);

    // Si vienen items del POS, calcular total desde ellos
    if (Array.isArray(items) && items.length > 0) {
      const totalCalc = items.reduce((s, i) => s + (parseFloat(i.precio_unitario) * parseInt(i.cantidad)), 0);
      const resumen   = items.map(i => `${i.nombre} x${i.cantidad}`).join(', ');

      // FIX #3: verificar stock antes de crear el pedido
      const stockSnap = {};
      for (const i of items.filter(i => i.producto_id)) {
        const prod = await req.prisma.producto.findFirst({ where: { id: parseInt(i.producto_id), restaurante_id: rid } });
        if (!prod) return res.status(404).json({ error: `Producto "${i.nombre}" no encontrado` });
        if (prod.stock < parseInt(i.cantidad)) return res.status(400).json({ error: `Stock insuficiente para ${prod.nombre}` });
        stockSnap[i.producto_id] = prod.stock;
      }

      const pedido = await req.prisma.pedido.create({
        data: { numero, cliente_nombre, item: resumen, total: totalCalc, estado, fecha: fechaHoy, restaurante_id: rid, reserva_id: reserva_id || null, mesa: mesa || '', personas: parseInt(personas) || 0 },
      });

      const stockOps = items.filter(i => i.producto_id).flatMap(i => [
        req.prisma.producto.update({ where: { id: parseInt(i.producto_id) }, data: { stock: { decrement: parseInt(i.cantidad) } } }),
        req.prisma.inventarioMovimiento.create({
          data: { producto_id: parseInt(i.producto_id), usuario_id: req.user.id, tipo: 'salida', cantidad: parseInt(i.cantidad), motivo: `Pedido ${pedido.numero}`, restaurante_id: rid, stock_anterior: stockSnap[i.producto_id] ?? 0 },
        }),
      ]);

      const txResults = await req.prisma.$transaction([
        ...items.map(i => req.prisma.pedidoItem.create({
          data: { pedido_id: pedido.id, producto_id: i.producto_id ? parseInt(i.producto_id) : null, nombre: i.nombre, cantidad: parseInt(i.cantidad), precio_unitario: parseFloat(i.precio_unitario), restaurante_id: rid },
        })),
        ...stockOps,
      ]);
      const createdItems = txResults.slice(0, items.length);

      getIO()?.to(`rest_${rid}`).emit('pedido:nuevo', { id: pedido.id, numero: pedido.numero, cliente_nombre, mesa: mesa || '', total: totalCalc });
      return res.status(201).json({ ...pedido, items: createdItems });
    }

    // Compatibilidad con flujo anterior (item + total manual)
    if (!item || total == null) return res.status(400).json({ error: 'items[] o (item + total) requeridos' });
    const pedido = await req.prisma.pedido.create({
      data: { numero, cliente_nombre, item, total: parseFloat(total), estado, fecha: fechaHoy, restaurante_id: rid, reserva_id: reserva_id || null, mesa: mesa || '', personas: parseInt(personas) || 0 },
    });
    getIO()?.to(`rest_${rid}`).emit('pedido:nuevo', { id: pedido.id, numero: pedido.numero, cliente_nombre, mesa: mesa || '', total: parseFloat(total) });
    res.status(201).json({ ...pedido, items: [] });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message || 'Error interno' }); }
});

// POST /api/pedidos/:id/items
router.post('/:id/items', verifyRole('admin', 'staff', 'chef', 'gerente'), async (req, res) => {
  try {
    const rid      = RID(req);
    const pedidoId = parseInt(req.params.id);
    const { producto_id, nombre, cantidad = 1, precio_unitario } = req.body;
    if (!nombre || precio_unitario == null) return res.status(400).json({ error: 'nombre y precio_unitario requeridos' });

    const pedido = await req.prisma.pedido.findFirst({ where: { id: pedidoId, restaurante_id: rid } });
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    // FIX #1 + #4 + #5: transaction interactiva — check+decrement+item+total son atómicos
    let prodRef = null;
    let item;

    try {
      await req.prisma.$transaction(async (tx) => {
        if (producto_id) {
          const prod = await tx.producto.findFirst({ where: { id: parseInt(producto_id), restaurante_id: rid } });
          if (!prod) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
          const stockResult = await tx.producto.updateMany({
            where: { id: parseInt(producto_id), restaurante_id: rid, stock: { gte: parseInt(cantidad) } },
            data: { stock: { decrement: parseInt(cantidad) } },
          });
          if (stockResult.count === 0) throw Object.assign(new Error(`Stock insuficiente para ${prod.nombre}`), { status: 400 });
          prodRef = { ...prod };
          await tx.inventarioMovimiento.create({
            data: { producto_id: parseInt(producto_id), usuario_id: req.user.id, tipo: 'salida', cantidad: parseInt(cantidad), motivo: `Pedido ${pedido.numero}`, restaurante_id: rid, stock_anterior: prod.stock },
          });
        }
        item = await tx.pedidoItem.create({
          data: { pedido_id: pedidoId, producto_id: producto_id ? parseInt(producto_id) : null, nombre, cantidad: parseInt(cantidad), precio_unitario: parseFloat(precio_unitario), restaurante_id: rid },
        });
        const allItems = await tx.pedidoItem.findMany({ where: { pedido_id: pedidoId } });
        const nuevoTotal = allItems.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0);
        await tx.pedido.update({ where: { id: pedidoId }, data: { total: nuevoTotal } });
      });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      throw e;
    }

    // FIX #5: leer stock real post-transaction para la alerta
    if (prodRef) {
      const prodActualizado = await req.prisma.producto.findUnique({ where: { id: parseInt(producto_id) } });
      const stockReal = prodActualizado?.stock ?? (prodRef.stock - parseInt(cantidad));
      if (prodRef.stock_minimo > 0 && stockReal <= prodRef.stock_minimo) {
        getIO()?.to(`rest_${rid}`).emit('stock:alerta', { nombre: prodRef.nombre, stock: stockReal, minimo: prodRef.stock_minimo });
        sendStockAlert({ ...prodRef, stock: stockReal }, stockReal);
      }
    }

    res.status(201).json(item);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// PATCH /api/pedidos/:id/items/:itemId — actualizar cantidad
router.patch('/:id/items/:itemId', verifyRole('admin', 'staff', 'chef', 'gerente'), async (req, res) => {
  try {
    const rid      = RID(req);
    const pedidoId = parseInt(req.params.id);
    const itemId   = parseInt(req.params.itemId);
    const { cantidad } = req.body;
    if (!cantidad || parseInt(cantidad) < 1) return res.status(400).json({ error: 'cantidad debe ser >= 1' });

    const pedido = await req.prisma.pedido.findFirst({ where: { id: pedidoId, restaurante_id: rid } });
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    const item = await req.prisma.pedidoItem.findFirst({ where: { id: itemId, pedido_id: pedidoId } });
    if (!item) return res.status(404).json({ error: 'Ítem no encontrado' });

    // FIX #2: transaction interactiva — check+decrement+update son atómicos
    const delta = parseInt(cantidad) - item.cantidad;
    let updated;
    let nuevoTotal;

    try {
      await req.prisma.$transaction(async (tx) => {
        if (delta !== 0 && item.producto_id) {
          const prod = await tx.producto.findFirst({ where: { id: item.producto_id, restaurante_id: rid } });
          if (delta > 0) {
            const stockResult = await tx.producto.updateMany({
              where: { id: item.producto_id, restaurante_id: rid, stock: { gte: delta } },
              data: { stock: { decrement: delta } },
            });
            if (stockResult.count === 0) throw Object.assign(new Error(`Stock insuficiente para ${prod?.nombre}`), { status: 400 });
          } else {
            await tx.producto.update({ where: { id: item.producto_id }, data: { stock: { decrement: delta } } });
          }
          if (prod) {
            await tx.inventarioMovimiento.create({
              data: { producto_id: item.producto_id, usuario_id: req.user.id, tipo: delta > 0 ? 'salida' : 'entrada', cantidad: Math.abs(delta), motivo: `Ajuste cantidad Pedido #${pedidoId}`, restaurante_id: rid, stock_anterior: prod.stock },
            });
          }
        }
        updated = await tx.pedidoItem.update({ where: { id: itemId }, data: { cantidad: parseInt(cantidad) } });
        const allItems = await tx.pedidoItem.findMany({ where: { pedido_id: pedidoId } });
        nuevoTotal = allItems.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0);
        await tx.pedido.update({ where: { id: pedidoId }, data: { total: nuevoTotal } });
      });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      throw e;
    }

    res.json({ ...updated, nuevoTotal });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// DELETE /api/pedidos/:id/items/:itemId
router.delete('/:id/items/:itemId', verifyRole('admin', 'staff', 'chef', 'gerente'), async (req, res) => {
  try {
    const rid      = RID(req);
    const pedidoId = parseInt(req.params.id);
    const itemId   = parseInt(req.params.itemId);

    const pedido = await req.prisma.pedido.findFirst({ where: { id: pedidoId, restaurante_id: rid } });
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    const item = await req.prisma.pedidoItem.findFirst({ where: { id: itemId, pedido_id: pedidoId } });
    if (!item) return res.status(404).json({ error: 'Ítem no encontrado' });

    const ops = [req.prisma.pedidoItem.delete({ where: { id: itemId } })];
    if (item.producto_id) {
      const prod = await req.prisma.producto.findUnique({ where: { id: item.producto_id } });
      ops.push(req.prisma.producto.update({ where: { id: item.producto_id }, data: { stock: { increment: item.cantidad } } }));
      ops.push(req.prisma.inventarioMovimiento.create({
        data: { producto_id: item.producto_id, usuario_id: req.user.id, tipo: 'entrada', cantidad: item.cantidad, motivo: `Devolución ítem Pedido #${pedidoId}`, restaurante_id: rid, stock_anterior: prod?.stock ?? 0 },
      }));
    }
    await req.prisma.$transaction(ops);

    const allItems = await req.prisma.pedidoItem.findMany({ where: { pedido_id: pedidoId } });
    const nuevoTotal = allItems.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0);
    await req.prisma.pedido.update({ where: { id: pedidoId }, data: { total: nuevoTotal } });

    res.json({ ok: true, nuevoTotal });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// PATCH /api/pedidos/:id/estado
router.patch('/:id/estado', async (req, res) => {
  try {
    const { estado, metodo_pago = 'efectivo' } = req.body;
    const valid = ['pendiente', 'en preparación', 'listo', 'confirmado', 'entregado', 'cancelado'];
    if (!valid.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });

    const pedidoId = parseInt(req.params.id);
    const rid = RID(req);
    const pedido = await req.prisma.pedido.findFirst({ where: { id: pedidoId, restaurante_id: rid } });
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (estado === 'confirmado') {
      if (pedido.estado === 'confirmado') return res.json({ ok: true });

      const ventaExistente = await req.prisma.venta.findFirst({
        where:   { pedido_id: pedidoId },
        include: { venta_items: true },
      });
      if (ventaExistente) {
        await req.prisma.pedido.update({ where: { id: pedidoId }, data: { estado } });
        return res.json({ ok: true, venta: { ...ventaExistente, items: ventaExistente.venta_items } });
      }

      const cfg = await req.prisma.configNegocio.findUnique({ where: { restaurante_id: rid } }) || {};
      const taxRate   = cfg.tax_rate ?? 19;
      const impActivo = cfg.impuesto_activo != null ? Boolean(cfg.impuesto_activo) : true;
      const fechaVenta = new Date().toISOString().split('T')[0]; // string for ventaHelper

      const dbItems = await req.prisma.pedidoItem.findMany({ where: { pedido_id: pedidoId } });
      let ventaItems;
      if (dbItems.length > 0) {
        ventaItems = dbItems.map(i => ({ nombre: i.nombre, qty: i.cantidad, precio_unit: i.precio_unitario, producto_id: i.producto_id }));
      } else {
        const totalCalc    = parseFloat(pedido.total);
        const subtotalCalc = impActivo ? parseFloat((totalCalc / (1 + taxRate / 100)).toFixed(2)) : totalCalc;
        ventaItems = [{ nombre: pedido.item, qty: 1, precio_unit: subtotalCalc, producto_id: null }];
      }

      const totalCalc    = parseFloat(pedido.total);
      const subtotalCalc = impActivo ? parseFloat((totalCalc / (1 + taxRate / 100)).toFixed(2)) : totalCalc;
      const metodo    = VALID_METODOS.includes(metodo_pago) ? metodo_pago : 'efectivo';

      let venta;
      try {
        venta = await createVentaConTicket(
          req.prisma,
          { subtotal: subtotalCalc, total: totalCalc, metodo_pago: metodo, cajero: req.user.nombre, restaurante_id: rid, pedido_id: pedidoId },
          cfg, fechaVenta, rid,
        );
        await req.prisma.ventaItem.createMany({
          data: ventaItems.map(i => ({
            venta_id:        venta.id,
            nombre:          i.nombre || '',
            qty:             i.qty || 1,
            precio_unitario: i.precio_unit || i.precio_unitario || 0,
            producto_id:     i.producto_id || null,
            restaurante_id:  rid,
          })),
        });
      } catch (e) {
        if (e.code === 'P2002') {
          venta = await req.prisma.venta.findFirst({
            where:   { pedido_id: pedidoId },
            include: { venta_items: true },
          });
          if (!venta) throw e;
        } else { throw e; }
      }
      const ventaItems2 = venta.venta_items || await req.prisma.ventaItem.findMany({ where: { venta_id: venta.id } });
      await req.prisma.pedido.update({ where: { id: pedidoId }, data: { estado, metodo_pago: metodo } });
      getIO()?.to(`rest_${rid}`).emit('pedido:estado', { id: pedidoId, numero: pedido.numero, estado, cliente_nombre: pedido.cliente_nombre, mesa: pedido.mesa });
      return res.json({ ok: true, venta: { ...venta, items: ventaItems2 } });
    }

    await req.prisma.pedido.update({ where: { id: pedidoId }, data: { estado } });
    getIO()?.to(`rest_${rid}`).emit('pedido:estado', { id: pedidoId, numero: pedido.numero, estado, cliente_nombre: pedido.cliente_nombre, mesa: pedido.mesa });
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message || 'Error interno' }); }
});

// DELETE /api/pedidos/:id
router.delete('/:id', verifyRole('admin'), verifyAdminCode, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const exists = await req.prisma.pedido.findFirst({ where: { id, restaurante_id: RID(req) } });
    if (!exists) return res.status(404).json({ error: 'Pedido no encontrado' });
    await req.prisma.pedido.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

module.exports = router;
