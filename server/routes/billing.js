const router      = require('express').Router();
const logger      = require('../lib/logger');
const requireAuth = require('../middleware/auth');
const { PLAN_LIMITS } = require('../lib/planLimits');
const {
  PLAN_IDS,
  crearOrden,
  capturarOrden,
  cancelarSuscripcion,
  verificarWebhook,
} = require('../lib/paypal');

const VALID_PLANS = ['pro', 'business'];

// POST /api/billing/checkout — crea orden PayPal v2 (pago único con capture)
router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!VALID_PLANS.includes(plan)) {
      return res.status(400).json({ error: 'Plan inválido. Valores permitidos: pro, business' });
    }

    const rid        = req.user.restaurante_id;
    const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;

    const { orderId, approvalUrl } = await crearOrden({
      plan,
      restauranteId: rid,
      returnUrl:     `${backendUrl}/api/billing/success?plan=${plan}`,
      cancelUrl:     `${backendUrl}/api/billing/cancel`,
    });

    logger.info({ rid, plan, orderId }, 'PayPal order created');
    res.json({ url: approvalUrl });
  } catch (e) {
    logger.error({ err: e }, 'billing checkout error');
    res.status(500).json({ error: 'Error al crear orden PayPal' });
  }
});

// GET /api/billing/success — PayPal redirige aquí tras aprobación del pago
router.get('/success', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { token, plan } = req.query; // token = PayPal order ID; PayerID viene en query también

  if (!token || !VALID_PLANS.includes(plan)) {
    logger.warn({ token, plan }, 'billing success: parámetros inválidos');
    return res.redirect(`${frontendUrl}/dashboard?error=invalid_params`);
  }

  try {
    const capture = await capturarOrden(token);

    if (capture.status !== 'COMPLETED') {
      logger.warn({ token, status: capture.status }, 'billing success: orden no completada');
      return res.redirect(`${frontendUrl}/dashboard?error=payment_incomplete`);
    }

    const customId = capture.purchase_units?.[0]?.custom_id;
    const rid      = customId ? parseInt(customId, 10) : null;

    if (!rid) {
      logger.error({ token, customId }, 'billing success: restaurante_id no encontrado en la orden');
      return res.redirect(`${frontendUrl}/dashboard?error=order_data_missing`);
    }

    await req.prisma.restaurante.update({
      where: { id: rid },
      data:  { plan },
    });

    logger.info({ rid, plan, token }, 'PayPal order captured — plan actualizado');
    res.redirect(`${frontendUrl}/dashboard?upgraded=true`);
  } catch (e) {
    logger.error({ err: e, token }, 'billing success error');
    res.redirect(`${frontendUrl}/dashboard?error=capture_failed`);
  }
});

// GET /api/billing/cancel — PayPal redirige aquí si el usuario cancela el pago
router.get('/cancel', (_req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/dashboard?cancelled=true`);
});

// POST /api/billing/webhook
router.post('/webhook', async (req, res) => {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  try {
    const valid = await verificarWebhook({ headers: req.headers, body: req.body, webhookId });
    if (!valid) {
      logger.warn('PayPal webhook: firma inválida');
      return res.status(400).json({ error: 'Firma inválida' });
    }
  } catch (e) {
    logger.warn({ err: e }, 'PayPal webhook verify failed');
    return res.status(400).json({ error: 'Error verificando webhook' });
  }

  const event  = req.body;
  const prisma = req.prisma;

  try {
    switch (event.event_type) {

      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const sub = event.resource;
        const rid = parseInt(sub.custom_id);
        if (!rid) break;
        const plan = sub.plan_id === PLAN_IDS.business ? 'business' : 'pro';
        await prisma.restaurante.update({
          where: { id: rid },
          data:  { plan, paypal_subscription_id: sub.id },
        });
        logger.info({ rid, plan }, 'PayPal subscription activated');
        break;
      }

      case 'PAYMENT.SALE.COMPLETED': {
        const subscriptionId = event.resource?.billing_agreement_id;
        if (!subscriptionId) break;
        const r = await prisma.restaurante.findFirst({
          where:  { paypal_subscription_id: subscriptionId },
          select: { id: true },
        });
        if (r) logger.info({ rid: r.id }, 'PayPal payment completed');
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        const subscriptionId = event.resource?.id;
        if (!subscriptionId) break;
        const r = await prisma.restaurante.findFirst({
          where:  { paypal_subscription_id: subscriptionId },
          select: { id: true },
        });
        if (!r) break;
        await prisma.restaurante.update({
          where: { id: r.id },
          data:  { plan: 'free', paypal_subscription_id: null },
        });
        logger.info({ rid: r.id }, 'PayPal subscription cancelled — plan degradado a free');
        break;
      }
    }

    res.json({ received: true });
  } catch (e) {
    logger.error({ err: e, event: event.event_type }, 'webhook handler error');
    res.status(500).json({ error: 'Error procesando evento' });
  }
});

// GET /api/billing/usage
router.get('/usage', requireAuth, async (req, res) => {
  try {
    const restaurante = await req.prisma.restaurante.findUnique({
      where:  { id: req.user.restaurante_id },
      select: { plan: true, ordenes_mes_actual: true, billing_ciclo_inicio: true },
    });

    const plan   = restaurante.plan || 'free';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
    const usadas = restaurante.ordenes_mes_actual || 0;
    const limite = limits.ordenes_mes === Infinity ? null : limits.ordenes_mes;
    const pct    = limite ? Math.round((usadas / limite) * 100) : 0;

    res.json({
      plan,
      ordenes_usadas: usadas,
      ordenes_limite: limite,
      porcentaje:     pct,
      ciclo_inicio:   restaurante.billing_ciclo_inicio,
    });
  } catch (e) {
    logger.error({ err: e }, 'billing usage error');
    res.status(500).json({ error: 'Error interno' });
  }
});

// DELETE /api/billing/cancel
router.delete('/cancel', requireAuth, async (req, res) => {
  try {
    const restaurante = await req.prisma.restaurante.findUnique({
      where:  { id: req.user.restaurante_id },
      select: { paypal_subscription_id: true },
    });

    if (!restaurante?.paypal_subscription_id) {
      return res.status(400).json({ error: 'No hay suscripción activa para cancelar' });
    }

    await cancelarSuscripcion(restaurante.paypal_subscription_id);

    await req.prisma.restaurante.update({
      where: { id: req.user.restaurante_id },
      data:  { plan: 'free', paypal_subscription_id: null },
    });

    logger.info({ rid: req.user.restaurante_id }, 'suscripción cancelada por el usuario');
    res.json({ ok: true, message: 'Suscripción cancelada. Plan degradado a Starter.' });
  } catch (e) {
    logger.error({ err: e }, 'billing cancel error');
    res.status(500).json({ error: 'Error al cancelar suscripción' });
  }
});

module.exports = router;
