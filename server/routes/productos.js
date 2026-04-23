const logger = require('../lib/logger');
const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const verifyRole  = require('../middleware/verifyRole');

router.use(requireAuth);
router.use(require('../middleware/requireTenant'));

const RID = (req) => req.user.restaurante_id;

// GET /api/productos?categoria=xxx
router.get('/', async (req, res) => {
  try {
    const { categoria } = req.query;
    const rid = RID(req);
    const where = { activo: true, restaurante_id: rid };
    if (categoria) where.categoria = categoria;
    const rows = await req.prisma.producto.findMany({
      where,
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    });
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/productos
router.post('/', verifyRole('admin', 'gerente'), async (req, res) => {
  try {
    const { nombre, categoria, precio, stock = 0 } = req.body;
    if (!nombre || !categoria || precio == null)
      return res.status(400).json({ error: 'nombre, categoria y precio requeridos' });

    const rid = RID(req);
    const cat = await req.prisma.categoria.findFirst({ where: { nombre: categoria, restaurante_id: rid } });
    if (!cat) return res.status(400).json({ error: `Categoría "${categoria}" no existe. Créala primero.` });

    const producto = await req.prisma.producto.create({
      data: { nombre: nombre.trim(), categoria, precio: parseFloat(precio), stock: parseInt(stock), restaurante_id: rid },
    });
    res.status(201).json(producto);
  } catch (e) { logger.error({ err: e }, 'route error'); res.status(500).json({ error: 'Error interno' }); }
});

// PUT /api/productos/:id
router.put('/:id', verifyRole('admin', 'gerente'), async (req, res) => {
  try {
    const { nombre, categoria, precio, stock } = req.body;
    if (!nombre || !categoria || precio == null)
      return res.status(400).json({ error: 'nombre, categoria y precio requeridos' });

    const id = parseInt(req.params.id);
    const exists = await req.prisma.producto.findFirst({ where: { id, restaurante_id: RID(req) } });
    if (!exists) return res.status(404).json({ error: 'Producto no encontrado' });

    const producto = await req.prisma.producto.update({
      where: { id },
      data: { nombre: nombre.trim(), categoria, precio: parseFloat(precio), stock: parseInt(stock ?? 0) },
    });
    res.json(producto);
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// PATCH /api/productos/:id/stock
router.patch('/:id/stock', async (req, res) => {
  try {
    const { delta } = req.body;
    if (delta == null || isNaN(delta)) return res.status(400).json({ error: 'delta requerido' });

    const id = parseInt(req.params.id);
    const rid = RID(req);
    const prod = await req.prisma.producto.findFirst({ where: { id, restaurante_id: rid } });
    if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });

    const newStock = Math.max(0, prod.stock + parseInt(delta));
    const [producto] = await req.prisma.$transaction([
      req.prisma.producto.update({ where: { id }, data: { stock: newStock } }),
      req.prisma.inventarioMovimiento.create({
        data: {
          producto_id: id, usuario_id: req.user.id,
          tipo: delta > 0 ? 'entrada' : 'salida',
          cantidad: Math.abs(parseInt(delta)),
          motivo: 'Ajuste manual desde menú',
          restaurante_id: rid,
          stock_anterior: prod.stock,
        },
      }),
    ]);
    res.json({ id: producto.id, nombre: producto.nombre, stock: producto.stock });
  } catch (e) { logger.error({ err: e }, 'route error'); res.status(500).json({ error: 'Error interno' }); }
});

// DELETE /api/productos/:id — soft delete
router.delete('/:id', verifyRole('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const exists = await req.prisma.producto.findFirst({ where: { id, restaurante_id: RID(req) } });
    if (!exists) return res.status(404).json({ error: 'Producto no encontrado' });
    await req.prisma.producto.update({ where: { id }, data: { activo: false } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

module.exports = router;
