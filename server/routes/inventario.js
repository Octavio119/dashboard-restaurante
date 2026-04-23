const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const verifyRole  = require('../middleware/verifyRole');

router.use(requireAuth);
router.use(require('../middleware/requireTenant'));

const RID = (req) => req.user.restaurante_id;

// ─── PROVEEDORES ─────────────────────────────────────────────────────────────

router.get('/proveedores', async (req, res) => {
  try {
    const rows = await req.prisma.proveedor.findMany({
      where: { restaurante_id: RID(req) },
      orderBy: { nombre: 'asc' },
    });
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

router.post('/proveedores', verifyRole('admin', 'gerente'), async (req, res) => {
  try {
    const { nombre, contacto, telefono, email } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre del proveedor requerido' });
    const prov = await req.prisma.proveedor.create({
      data: { nombre: nombre.trim(), contacto, telefono, email, restaurante_id: RID(req) },
    });
    res.status(201).json(prov);
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

router.put('/proveedores/:id', verifyRole('admin', 'gerente'), async (req, res) => {
  try {
    const { nombre, contacto, telefono, email } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre del proveedor requerido' });
    const id = parseInt(req.params.id);
    const exists = await req.prisma.proveedor.findFirst({ where: { id, restaurante_id: RID(req) } });
    if (!exists) return res.status(404).json({ error: 'Proveedor no encontrado' });
    const prov = await req.prisma.proveedor.update({ where: { id }, data: { nombre: nombre.trim(), contacto, telefono, email } });
    res.json(prov);
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

router.delete('/proveedores/:id', verifyRole('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const exists = await req.prisma.proveedor.findFirst({ where: { id, restaurante_id: RID(req) } });
    if (!exists) return res.status(404).json({ error: 'Proveedor no encontrado' });
    await req.prisma.proveedor.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// ─── MOVIMIENTOS ─────────────────────────────────────────────────────────────

// GET /api/inventario/movimientos?tipo=&producto_id=&fecha_desde=&fecha_hasta=&limit=&offset=
router.get('/movimientos', async (req, res) => {
  try {
    const rid = RID(req);
    const { tipo, producto_id, fecha_desde, fecha_hasta, limit = 100, offset = 0 } = req.query;
    const limitVal  = Math.min(parseInt(limit) || 100, 500);
    const offsetVal = parseInt(offset) || 0;

    const where = { restaurante_id: rid };
    if (tipo && ['entrada', 'salida', 'ajuste'].includes(tipo)) where.tipo = tipo;
    if (producto_id) where.producto_id = parseInt(producto_id);
    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha.gte = new Date(fecha_desde + 'T00:00:00');
      if (fecha_hasta) where.fecha.lte = new Date(fecha_hasta + 'T23:59:59');
    }

    const [rows, total, statsRaw] = await Promise.all([
      req.prisma.inventarioMovimiento.findMany({
        where,
        include: {
          producto:  { select: { nombre: true } },
          usuario:   { select: { nombre: true } },
          proveedor: { select: { nombre: true } },
        },
        orderBy: { fecha: 'desc' },
        take: limitVal,
        skip: offsetVal,
      }),
      req.prisma.inventarioMovimiento.count({ where }),
      req.prisma.inventarioMovimiento.groupBy({
        by: ['tipo'],
        where,
        _count: { id: true },
        _sum:   { cantidad: true },
      }),
    ]);

    const mappedRows = rows.map(m => ({
      ...m,
      producto_nombre:  m.producto?.nombre  || null,
      usuario_nombre:   m.usuario?.nombre   || null,
      proveedor_nombre: m.proveedor?.nombre || null,
    }));

    const stats = { entrada: { count: 0, total: 0 }, salida: { count: 0, total: 0 }, ajuste: { count: 0, total: 0 } };
    for (const s of statsRaw) {
      if (stats[s.tipo]) { stats[s.tipo].count = s._count.id; stats[s.tipo].total = s._sum.cantidad ?? 0; }
    }

    res.json({ rows: mappedRows, total, stats });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/inventario/movimientos
router.post('/movimientos', async (req, res) => {
  try {
    const { producto_id, tipo, cantidad, motivo, proveedor_id } = req.body;
    const rid = RID(req);

    if (!producto_id || !tipo || !cantidad)
      return res.status(400).json({ error: 'producto_id, tipo y cantidad requeridos' });
    if (!['entrada', 'salida', 'ajuste'].includes(tipo))
      return res.status(400).json({ error: 'tipo debe ser entrada, salida o ajuste' });

    let stockAnterior;
    let stockNuevo;
    try {
      await req.prisma.$transaction(async (tx) => {
        const prod = await tx.producto.findFirst({ where: { id: parseInt(producto_id), restaurante_id: rid } });
        if (!prod) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
        stockAnterior = prod.stock;

        if (tipo === 'entrada') {
          const updated = await tx.producto.update({
            where: { id: parseInt(producto_id) },
            data: { stock: { increment: Number(cantidad) } },
          });
          stockNuevo = updated.stock;
        } else {
          // salida / ajuste: rechazar si stock insuficiente (condición atómica)
          const result = await tx.producto.updateMany({
            where: { id: parseInt(producto_id), restaurante_id: rid, stock: { gte: Number(cantidad) } },
            data: { stock: { decrement: Number(cantidad) } },
          });
          if (result.count === 0) throw Object.assign(new Error('Stock insuficiente para registrar salida'), { status: 400 });
          stockNuevo = stockAnterior - Number(cantidad);
        }

        await tx.inventarioMovimiento.create({
          data: {
            producto_id: parseInt(producto_id),
            usuario_id:  req.user.id,
            tipo,
            cantidad:    Number(cantidad),
            motivo:      motivo || null,
            proveedor_id: proveedor_id ? parseInt(proveedor_id) : null,
            restaurante_id: rid,
            stock_anterior: stockAnterior,
          },
        });
      });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      throw e;
    }

    res.status(201).json({ ok: true, stock_anterior: stockAnterior, stock_nuevo: stockNuevo });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al procesar el movimiento: ' + e.message }); }
});

module.exports = router;
