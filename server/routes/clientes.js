const router = require('express').Router();
const requireAuth     = require('../middleware/auth');
const verifyRole      = require('../middleware/verifyRole');
const verifyAdminCode = require('../middleware/verifyAdminCode');

router.use(requireAuth);
router.use(require('../middleware/requireTenant'));

const RID = (req) => req.user.restaurante_id;

// GET /api/clientes?q=texto
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    const rid = RID(req);
    const where = { restaurante_id: rid };
    if (q) {
      where.OR = [
        { nombre:   { contains: q, mode: 'insensitive' } },
        { email:    { contains: q, mode: 'insensitive' } },
        { rut:      { contains: q, mode: 'insensitive' } },
      ];
    }
    const rows = await req.prisma.cliente.findMany({ where, orderBy: { nombre: 'asc' } });
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// GET /api/clientes/:id
router.get('/:id', async (req, res) => {
  try {
    const rid = RID(req);
    const cliente = await req.prisma.cliente.findFirst({ where: { id: parseInt(req.params.id), restaurante_id: rid } });
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    const pedidos = await req.prisma.pedido.findMany({
      where: { cliente_nombre: cliente.nombre, restaurante_id: rid },
      select: { id: true, numero: true, item: true, total: true, fecha: true },
      orderBy: { fecha: 'desc' },
      take: 20,
    });
    res.json({ ...cliente, pedidos });
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/clientes
router.post('/', async (req, res) => {
  try {
    const { nombre, email, telefono, rut, tipo_cliente = 'persona', razon_social } = req.body;
    if (!nombre) return res.status(400).json({ error: 'nombre requerido' });
    const cliente = await req.prisma.cliente.create({
      data: {
        nombre: nombre.trim(), email: email || '', telefono: telefono || '',
        rut: rut || '', tipo_cliente, razon_social: razon_social || '',
        restaurante_id: RID(req),
      },
    });
    res.status(201).json(cliente);
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// PUT /api/clientes/:id
router.put('/:id', async (req, res) => {
  try {
    const { nombre, email, telefono, rut, tipo_cliente, razon_social, estado } = req.body;
    if (!nombre) return res.status(400).json({ error: 'nombre requerido' });
    const id = parseInt(req.params.id);
    const exists = await req.prisma.cliente.findFirst({ where: { id, restaurante_id: RID(req) } });
    if (!exists) return res.status(404).json({ error: 'Cliente no encontrado' });
    const cliente = await req.prisma.cliente.update({
      where: { id },
      data: {
        nombre, email: email || '', telefono: telefono || '', rut: rut || '',
        tipo_cliente: tipo_cliente || 'persona', razon_social: razon_social || '',
        estado: estado || 'Nuevo',
      },
    });
    res.json(cliente);
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// DELETE /api/clientes/:id
router.delete('/:id', verifyRole('admin'), verifyAdminCode, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const exists = await req.prisma.cliente.findFirst({ where: { id, restaurante_id: RID(req) } });
    if (!exists) return res.status(404).json({ error: 'Cliente no encontrado' });
    await req.prisma.cliente.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

module.exports = router;
