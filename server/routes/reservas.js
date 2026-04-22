const router = require('express').Router();
const requireAuth     = require('../middleware/auth');
const verifyRole      = require('../middleware/verifyRole');
const verifyAdminCode = require('../middleware/verifyAdminCode');
const { toDate, fromFilter }   = require('../lib/dateUtils');

router.use(requireAuth);
router.use(require('../middleware/requireTenant'));

const RID = (req) => req.user.restaurante_id;

async function buscarOCrearCliente(prisma, rid, nombre, email, telefono) {
  const emailVal = (email    || '').trim().toLowerCase();
  const telVal   = (telefono || '').trim();
  let cliente = null;
  if (emailVal) cliente = await prisma.cliente.findFirst({ where: { restaurante_id: rid, email: { equals: emailVal, mode: 'insensitive' } } });
  if (!cliente && telVal) cliente = await prisma.cliente.findFirst({ where: { restaurante_id: rid, telefono: telVal } });
  if (!cliente) {
    cliente = await prisma.cliente.create({ data: { nombre: nombre.trim(), email: emailVal, telefono: telVal, restaurante_id: rid } });
  }
  return cliente;
}

// GET /api/reservas?fecha=|periodo=
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

    const rows = await req.prisma.reserva.findMany({ where, orderBy: [{ fecha: 'asc' }, { hora: 'asc' }] });
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// GET /api/reservas/totales?periodo=dia|semana|mes
router.get('/totales', async (req, res) => {
  try {
    const { periodo = 'dia' } = req.query;
    const rid = RID(req);
    const hoy = new Date().toISOString().split('T')[0];
    let where = { restaurante_id: rid, estado: { not: 'cancelada' } };

    if (periodo === 'dia')    where.fecha = toDate(hoy);
    else if (periodo === 'semana') { const d = new Date(); d.setDate(d.getDate() - 7); where.fecha = fromFilter(d.toISOString().split('T')[0]); }
    else                     { const d = new Date(); d.setDate(d.getDate() - 30); where.fecha = fromFilter(d.toISOString().split('T')[0]); }

    const total = await req.prisma.reserva.count({ where });
    res.json({ total });
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/reservas
router.post('/', async (req, res) => {
  try {
    const { nombre, email, telefono, hora, personas, mesa, fecha, consumo_base = 0 } = req.body;
    if (!nombre || !hora || !personas || !fecha)
      return res.status(400).json({ error: 'nombre, hora, personas y fecha requeridos' });

    const rid = RID(req);
    const cliente = await buscarOCrearCliente(req.prisma, rid, nombre, email, telefono);

    const reserva = await req.prisma.reserva.create({
      data: { nombre, email: (email || '').trim().toLowerCase(), telefono: (telefono || '').trim(), hora, personas: parseInt(personas), mesa: mesa || '', estado: 'pendiente', fecha: toDate(fecha), consumo_base: parseFloat(consumo_base), cliente_id: cliente.id, restaurante_id: rid },
    });
    res.status(201).json(reserva);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error interno' }); }
});

// PATCH /api/reservas/:id/estado
router.patch('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const valid = ['pendiente', 'confirmada', 'asistió', 'cancelada'];
    if (!valid.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });

    const id  = parseInt(req.params.id);
    const rid = RID(req);
    const reserva = await req.prisma.reserva.findFirst({ where: { id, restaurante_id: rid } });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });

    await req.prisma.reserva.update({ where: { id }, data: { estado } });

    const debeActualizar = (
      (estado === 'confirmada' && reserva.estado !== 'confirmada') ||
      (estado === 'asistió'    && reserva.estado !== 'asistió')
    );

    if (debeActualizar) {
      let clienteId = reserva.cliente_id;
      if (!clienteId) {
        const c = await buscarOCrearCliente(req.prisma, rid, reserva.nombre, reserva.email, reserva.telefono);
        clienteId = c.id;
        await req.prisma.reserva.update({ where: { id }, data: { cliente_id: clienteId } });
      }

      const yaConfirmada = reserva.estado === 'confirmada' && estado === 'asistió';
      if (!yaConfirmada) {
        const cliente = await req.prisma.cliente.findFirst({ where: { id: clienteId, restaurante_id: rid } });
        if (cliente) {
          const nuevasVisitas = (cliente.visitas || 0) + 1;
          const nuevoEstado   = nuevasVisitas >= 10 ? 'VIP' : nuevasVisitas >= 3 ? 'Regular' : 'Nuevo';
          await req.prisma.cliente.update({ where: { id: clienteId }, data: { visitas: nuevasVisitas, estado: nuevoEstado } });
        }
      }
    }
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/reservas/backfill-clientes
router.post('/backfill-clientes', verifyRole('admin', 'gerente'), async (req, res) => {
  try {
    const rid = RID(req);
    const reservas = await req.prisma.reserva.findMany({
      where: { restaurante_id: rid, estado: { not: 'cancelada' }, cliente_id: null },
    });
    let creados = 0, vinculados = 0;
    for (const reserva of reservas) {
      try {
        const c = await buscarOCrearCliente(req.prisma, rid, reserva.nombre, reserva.email, reserva.telefono);
        await req.prisma.reserva.update({ where: { id: reserva.id }, data: { cliente_id: c.id } });
        if (c._count === undefined) vinculados++;
        else creados++;
      } catch {}
    }
    res.json({ ok: true, procesadas: reservas.length, creados, vinculados });
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/reservas/:id/crear-pedido
router.post('/:id/crear-pedido', async (req, res) => {
  try {
    const rid = RID(req);
    const id  = parseInt(req.params.id);
    const reserva = await req.prisma.reserva.findFirst({ where: { id, restaurante_id: rid } });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (reserva.estado === 'cancelada') return res.status(400).json({ error: 'No se puede crear pedido para una reserva cancelada' });

    const existing = await req.prisma.pedido.findFirst({
      where: { reserva_id: id, restaurante_id: rid, estado: { notIn: ['cancelado', 'confirmado'] } },
    });
    if (existing) return res.status(400).json({ error: 'Ya existe un pedido activo para esta reserva', pedido_id: existing.id });

    const numResult = await req.prisma.$queryRaw`
      SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(numero, '#ORD-', '') AS INTEGER)), 7281) AS max_num
      FROM "Pedido" WHERE restaurante_id = ${rid} AND numero ~ '^#ORD-[0-9]+$'
    `;
    const nextNum = Number(numResult[0]?.max_num ?? 7281) + 1;

    const pedido = await req.prisma.pedido.create({
      data: { numero: `#ORD-${nextNum}`, cliente_nombre: reserva.nombre, item: `Pedido de mesa ${reserva.mesa || 'sin asignar'}`, total: 0, estado: 'pendiente', fecha: reserva.fecha, restaurante_id: rid, reserva_id: id, mesa: reserva.mesa || '', personas: reserva.personas || 0 }, // reserva.fecha ya es DateTime
    });
    res.status(201).json({ ...pedido, items: [] });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error interno' }); }
});

// DELETE /api/reservas/:id
router.delete('/:id', verifyRole('admin', 'gerente'), verifyAdminCode, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const exists = await req.prisma.reserva.findFirst({ where: { id, restaurante_id: RID(req) } });
    if (!exists) return res.status(404).json({ error: 'Reserva no encontrada' });
    await req.prisma.reserva.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// GET /api/reservas/:id/consumos
router.get('/:id/consumos', async (req, res) => {
  try {
    const rows = await req.prisma.reservaConsumo.findMany({
      where: { reserva_id: parseInt(req.params.id), restaurante_id: RID(req) },
    });
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/reservas/:id/consumos
router.post('/:id/consumos', async (req, res) => {
  try {
    const rid = RID(req);
    const reserva_id = parseInt(req.params.id);
    const { producto_id, nombre, cantidad, precio_unitario } = req.body;
    if (!nombre || !cantidad || precio_unitario == null)
      return res.status(400).json({ error: 'nombre, cantidad y precio_unitario requeridos' });

    const reserva = await req.prisma.reserva.findFirst({ where: { id: reserva_id, restaurante_id: rid } });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });

    const ops = [];
    if (producto_id) {
      const prod = await req.prisma.producto.findFirst({ where: { id: parseInt(producto_id), restaurante_id: rid } });
      if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });
      if (prod.stock < cantidad) return res.status(400).json({ error: `Stock insuficiente para ${prod.nombre}` });
      ops.push(req.prisma.producto.update({ where: { id: parseInt(producto_id) }, data: { stock: { decrement: parseInt(cantidad) } } }));
      ops.push(req.prisma.inventarioMovimiento.create({
        data: { producto_id: parseInt(producto_id), usuario_id: req.user.id, tipo: 'salida', cantidad: parseInt(cantidad), motivo: `Consumo Reserva #${reserva_id}`, restaurante_id: rid, stock_anterior: prod.stock },
      }));
    }

    const consumo = await req.prisma.reservaConsumo.create({
      data: { reserva_id, producto_id: producto_id ? parseInt(producto_id) : null, nombre, cantidad: parseInt(cantidad), precio_unitario: parseFloat(precio_unitario), restaurante_id: rid },
    });

    const allConsumos = await req.prisma.reservaConsumo.findMany({ where: { reserva_id, restaurante_id: rid } });
    const nuevoTotal = allConsumos.reduce((s, c) => s + c.cantidad * c.precio_unitario, 0);

    await req.prisma.$transaction([
      ...ops,
      req.prisma.reserva.update({ where: { id: reserva_id }, data: { consumo_base: nuevoTotal } }),
    ]);

    res.status(201).json(consumo);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// DELETE /api/reservas/:id/consumos/:cid
router.delete('/:id/consumos/:cid', async (req, res) => {
  try {
    const rid        = RID(req);
    const reserva_id = parseInt(req.params.id);
    const cid        = parseInt(req.params.cid);

    const reserva = await req.prisma.reserva.findFirst({ where: { id: reserva_id, restaurante_id: rid } });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });

    const item = await req.prisma.reservaConsumo.findFirst({ where: { id: cid, reserva_id, restaurante_id: rid } });
    if (!item) return res.status(404).json({ error: 'Ítem no encontrado' });

    const ops = [req.prisma.reservaConsumo.delete({ where: { id: cid } })];
    if (item.producto_id) {
      const prod = await req.prisma.producto.findFirst({ where: { id: item.producto_id, restaurante_id: rid } });
      ops.push(req.prisma.producto.update({ where: { id: item.producto_id }, data: { stock: { increment: item.cantidad } } }));
      ops.push(req.prisma.inventarioMovimiento.create({
        data: { producto_id: item.producto_id, usuario_id: req.user.id, tipo: 'entrada', cantidad: item.cantidad, motivo: `Devolución consumo Reserva #${reserva_id}`, restaurante_id: rid, stock_anterior: prod?.stock ?? 0 },
      }));
    }
    await req.prisma.$transaction(ops);

    const allConsumos = await req.prisma.reservaConsumo.findMany({ where: { reserva_id, restaurante_id: rid } });
    const nuevoTotal = allConsumos.reduce((s, c) => s + c.cantidad * c.precio_unitario, 0);
    await req.prisma.reserva.update({ where: { id: reserva_id }, data: { consumo_base: nuevoTotal } });

    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

module.exports = router;
