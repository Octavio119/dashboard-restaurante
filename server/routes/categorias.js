const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const verifyRole  = require('../middleware/verifyRole');
const logger      = require('../lib/logger');

router.use(requireAuth);
router.use(require('../middleware/requireTenant'));

const RID = (req) => req.user.restaurante_id;

// GET /api/categorias
router.get('/', async (req, res) => {
  try {
    const rows = await req.prisma.categoria.findMany({
      where: { restaurante_id: RID(req) },
      orderBy: { nombre: 'asc' },
    });
    res.json(rows);
  } catch (e) {
    logger.error({ err: e }, 'categorias.list error');
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/categorias
router.post('/', verifyRole('admin', 'gerente'), async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'nombre requerido' });
    const slug = nombre.trim().toLowerCase();
    const cat = await req.prisma.categoria.create({ data: { nombre: slug, restaurante_id: RID(req) } });
    res.status(201).json(cat);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Esa categoría ya existe' });
    // Sin este log no había forma de saber por qué fallaba en producción —
    // el catch devolvía "Error interno" genérico y descartaba e por completo.
    logger.error({ err: e, errCode: e.code, meta: e.meta, rid: RID(req) }, 'categorias.create error');
    res.status(500).json({ error: 'Error interno' });
  }
});

// PUT /api/categorias/:id
router.put('/:id', verifyRole('admin', 'gerente'), async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'nombre requerido' });
    const rid = RID(req);
    const id = parseInt(req.params.id);
    const slug = nombre.trim().toLowerCase();

    const anterior = await req.prisma.categoria.findFirst({ where: { id, restaurante_id: rid } });
    if (!anterior) return res.status(404).json({ error: 'Categoría no encontrada' });

    const [cat] = await req.prisma.$transaction([
      req.prisma.categoria.update({ where: { id }, data: { nombre: slug } }),
      req.prisma.producto.updateMany({ where: { categoria: anterior.nombre, restaurante_id: rid }, data: { categoria: slug } }),
    ]);
    res.json(cat);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Ese nombre ya existe' });
    logger.error({ err: e, errCode: e.code, meta: e.meta }, 'categorias.update error');
    res.status(500).json({ error: 'Error interno' });
  }
});

// DELETE /api/categorias/:id
router.delete('/:id', verifyRole('admin'), async (req, res) => {
  try {
    const rid = RID(req);
    const id = parseInt(req.params.id);
    const cat = await req.prisma.categoria.findFirst({ where: { id, restaurante_id: rid } });
    if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });

    const productosHuerfanos = await req.prisma.producto.count({
      where: { categoria: cat.nombre, restaurante_id: rid, activo: true },
    });
    await req.prisma.categoria.delete({ where: { id } });
    res.json({ ok: true, productosHuerfanos });
  } catch (e) {
    logger.error({ err: e, errCode: e.code, meta: e.meta }, 'categorias.delete error');
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
