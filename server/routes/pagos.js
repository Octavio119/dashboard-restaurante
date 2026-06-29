'use strict';
const router      = require('express').Router();
const logger       = require('../lib/logger');
const requireAuth  = require('../middleware/auth');
const { sendPaymentProofEmail } = require('../lib/email');

const PLAN_MONTOS = { pro: 22, business: 49 };

// POST /api/pagos/transferencia — el usuario sube el comprobante de su
// transferencia bancaria; se reenvía por email para activación manual del plan.
router.post('/transferencia', requireAuth, async (req, res) => {
  const { plan, nombre, email, comprobante } = req.body;

  if (!PLAN_MONTOS[plan]) {
    return res.status(400).json({ error: 'Plan inválido. Valores permitidos: pro, business' });
  }
  if (!nombre || !email || !comprobante) {
    return res.status(400).json({ error: 'Faltan datos requeridos (nombre, email, comprobante)' });
  }

  // El nombre del restaurante se resuelve del tenant autenticado, no del body —
  // mismo criterio que el resto de la app: el servidor nunca confía en ese dato del cliente.
  const restaurante = await req.prisma.restaurante.findUnique({
    where:  { id: req.user.restaurante_id },
    select: { nombre: true },
  });

  const sent = await sendPaymentProofEmail({
    plan,
    monto:       PLAN_MONTOS[plan],
    nombre,
    email,
    restaurante: restaurante?.nombre || 'Restaurante sin nombre',
    comprobante,
  });

  if (!sent) {
    logger.error({ rid: req.user?.restaurante_id, plan }, 'No se pudo enviar el comprobante de pago por email');
    return res.status(502).json({ error: 'No se pudo enviar el comprobante. Intenta de nuevo en unos minutos.' });
  }

  logger.info({ rid: req.user?.restaurante_id, plan, nombre }, 'Comprobante de transferencia enviado');
  res.json({ ok: true, message: 'Comprobante recibido' });
});

module.exports = router;
