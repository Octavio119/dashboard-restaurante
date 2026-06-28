const router = require('express').Router();
const requireAuth   = require('../middleware/auth');
const requireTenant = require('../middleware/requireTenant');

router.use(requireAuth);
router.use(requireTenant);

const DEFAULT_NOMBRE = 'Mi Restaurante';

// GET /api/onboarding/status
// hasMesas no tiene tabla propia en el schema — se infiere de ConfigNegocio
// (nombre/rut/direccion ya no son el default), ya que el link de ese paso
// en el banner manda a Configuración → Negocio, no a una pantalla de mesas.
router.get('/status', async (req, res) => {
  try {
    const [categoriasCount, productosCount, pedidosCount, cfg] = await Promise.all([
      req.prisma.categoria.count(),
      req.prisma.producto.count(),
      req.prisma.pedido.count(),
      req.prisma.configNegocio.findFirst(),
    ]);

    const hasMenu   = categoriasCount > 0 && productosCount > 0;
    const hasMesas  = Boolean(cfg && (
      cfg.nombre.trim() !== DEFAULT_NOMBRE ||
      cfg.rut.trim() !== '' ||
      cfg.direccion.trim() !== ''
    ));
    const hasPedido = pedidosCount > 0;

    res.json({
      hasMenu,
      hasMesas,
      hasPedido,
      isComplete: hasMenu && hasMesas && hasPedido,
    });
  } catch (e) {
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
