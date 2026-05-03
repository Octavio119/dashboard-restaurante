'use strict';

const crypto      = require('crypto');
const bcrypt      = require('bcryptjs');
const router      = require('express').Router();
const logger      = require('../lib/logger');
const requireAuth = require('../middleware/auth');
const verifyRole  = require('../middleware/verifyRole');
const requireTenant = require('../middleware/requireTenant');
const { checkPlanFeature } = require('../lib/planLimits');

router.use(requireAuth);
router.use(requireTenant);

const RID = (req) => req.user.restaurante_id;

// ─── GET /api/apikeys ──────────────────────────────────────────────────────────
// List all API keys for this restaurant.
// Returns safe fields only — key_hash is NEVER exposed.
router.get('/', verifyRole('admin', 'gerente'), async (req, res) => {
  try {
    const keys = await req.prisma.apiKey.findMany({
      where: {
        restaurante_id: RID(req),
        activo: true,
      },
      select: {
        id:        true,
        nombre:    true,
        activo:    true,
        creado_at: true,
        // key_hash intentionally omitted
      },
      orderBy: { creado_at: 'desc' },
    });
    res.json(keys);
  } catch (e) {
    logger.error({ err: e }, 'apikeys GET error');
    res.status(500).json({ error: 'Error interno' });
  }
});

// ─── POST /api/apikeys ─────────────────────────────────────────────────────────
// Create a new API key.
// Requires plan: business.  Only admin / gerente roles.
// The raw key is returned ONCE — it is never stored in plain text.
router.post(
  '/',
  checkPlanFeature('api_keys'),
  verifyRole('admin', 'gerente'),
  async (req, res) => {
    try {
      const { nombre } = req.body;
      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ error: 'El campo "nombre" es requerido' });
      }

      // Generate a high-entropy raw key prefixed for easy identification
      const rawKey  = 'mpos_' + crypto.randomBytes(32).toString('hex');
      const keyHash = bcrypt.hashSync(rawKey, 10);

      const created = await req.prisma.apiKey.create({
        data: {
          nombre:         nombre.trim(),
          key_hash:       keyHash,
          restaurante_id: RID(req),
          activo:         true,
        },
        select: {
          id:        true,
          nombre:    true,
          creado_at: true,
          // key_hash intentionally omitted
        },
      });

      logger.info(
        { restaurante_id: RID(req), apikey_id: created.id, nombre: created.nombre },
        'API key created'
      );

      // rawKey is returned ONLY here — never again
      res.status(201).json({
        id:        created.id,
        nombre:    created.nombre,
        key:       rawKey,
        creado_at: created.creado_at,
        aviso:     'Guarda esta clave ahora. No podrás verla de nuevo.',
      });
    } catch (e) {
      logger.error({ err: e }, 'apikeys POST error');
      res.status(500).json({ error: 'Error interno' });
    }
  }
);

// ─── DELETE /api/apikeys/:id ───────────────────────────────────────────────────
// Soft-delete: sets activo = false.
// Only admin role.  Verifies key belongs to this restaurant.
router.delete('/:id', verifyRole('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const existing = await req.prisma.apiKey.findFirst({
      where: { id, restaurante_id: RID(req) },
      select: { id: true, nombre: true, activo: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'API key no encontrada' });
    }

    if (!existing.activo) {
      return res.status(409).json({ error: 'La API key ya fue revocada' });
    }

    await req.prisma.apiKey.update({
      where: { id },
      data:  { activo: false },
    });

    logger.info(
      {
        restaurante_id: RID(req),
        apikey_id:      id,
        nombre:         existing.nombre,
        revoked_by:     req.user.id,
      },
      'API key revoked'
    );

    res.json({ ok: true, mensaje: 'API key revocada correctamente' });
  } catch (e) {
    logger.error({ err: e }, 'apikeys DELETE error');
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
