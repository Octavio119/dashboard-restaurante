const router      = require('express').Router();
const Stripe      = require('stripe');
const logger      = require('../lib/logger');
const requireAuth = require('../middleware/auth');
const { PLAN_LIMITS } = require('../lib/planLimits');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');

const PRICE_TO_PLAN = {
  [process.env.STRIPE_PRICE_PRO]:      'pro',
  [process.env.STRIPE_PRICE_BUSINESS]: 'business',
};

// POST /api/billing/checkout
router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    const priceId  = plan === 'business'
      ? process.env.STRIPE_PRICE_BUSINESS
      : process.env.STRIPE_PRICE_PRO;

    if (!priceId) return res.status(400).json({ error: 'Plan inválido' });

    const prisma = req.prisma;
    const rid    = req.user.restaurante_id;

    const restaurante = await prisma.restaurante.findUnique({
      where:  { id: rid },
      select: { stripe_customer_id: true, nombre: true },
    });

    let customerId = restaurante.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    req.user.email,
        name:     restaurante.nombre,
        metadata: { restaurante_id: String(rid) },
      });
      customerId = customer.id;
      await prisma.restaurante.update({
        where: { id: rid },
        data:  { stripe_customer_id: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      payment_method_types: ['card'],
      mode:                 'subscription',
      line_items:           [{ price: priceId, quantity: 1 }],
      subscription_data:    { metadata: { restaurante_id: String(rid) } },
      success_url:          `${process.env.FRONTEND_URL}/billing?success=1`,
      cancel_url:           `${process.env.FRONTEND_URL}/billing?cancel=1`,
      metadata:             { restaurante_id: String(rid) },
    });

    res.json({ url: session.url });
  } catch (e) {
    logger.error({ err: e }, 'billing checkout error');
    res.status(500).json({ error: 'Error al crear sesión de pago' });
  }
});

// POST /api/billing/webhook  — body ya es raw buffer (ver app.js)
router.post('/webhook', async (req, res) => {
  const sig     = req.headers['stripe-signature'];
  const secret  = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (e) {
    logger.warn({ err: e }, 'stripe webhook signature invalid');
    return res.status(400).json({ error: `Webhook Error: ${e.message}` });
  }

  const prisma = req.prisma;

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const rid     = parseInt(session.metadata?.restaurante_id);
        if (!rid) break;
        const sub      = await stripe.subscriptions.retrieve(session.subscription);
        const priceId  = sub.items.data[0]?.price?.id;
        const nuevoPlan = PRICE_TO_PLAN[priceId] || 'pro';
        await prisma.restaurante.update({
          where: { id: rid },
          data:  { plan: nuevoPlan, stripe_subscription_id: session.subscription },
        });
        logger.info({ rid, nuevoPlan }, 'plan actualizado via checkout.session.completed');
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const sub     = await stripe.subscriptions.retrieve(invoice.subscription);
        const rid     = parseInt(sub.metadata?.restaurante_id || '0');
        if (!rid) break;
        const priceId   = sub.items.data[0]?.price?.id;
        const nuevoPlan = PRICE_TO_PLAN[priceId] || 'pro';
        await prisma.restaurante.update({
          where: { id: rid },
          data:  { plan: nuevoPlan },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const rid = parseInt(sub.metadata?.restaurante_id || '0');
        if (!rid) break;
        await prisma.restaurante.update({
          where: { id: rid },
          data:  { plan: 'free', stripe_subscription_id: null },
        });
        logger.info({ rid }, 'plan degradado a free por cancelación');
        break;
      }

      case 'customer.subscription.updated': {
        const sub     = event.data.object;
        const rid     = parseInt(sub.metadata?.restaurante_id || '0');
        if (!rid) break;
        const priceId   = sub.items.data[0]?.price?.id;
        const nuevoPlan = PRICE_TO_PLAN[priceId];
        if (nuevoPlan) {
          await prisma.restaurante.update({
            where: { id: rid },
            data:  { plan: nuevoPlan },
          });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (e) {
    logger.error({ err: e, event: event.type }, 'webhook handler error');
    res.status(500).json({ error: 'Error procesando evento' });
  }
});

// GET /api/billing/portal
router.get('/portal', requireAuth, async (req, res) => {
  try {
    const restaurante = await req.prisma.restaurante.findUnique({
      where:  { id: req.user.restaurante_id },
      select: { stripe_customer_id: true },
    });

    if (!restaurante?.stripe_customer_id) {
      return res.status(400).json({ error: 'No hay suscripción activa' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   restaurante.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/billing`,
    });

    res.json({ url: session.url });
  } catch (e) {
    logger.error({ err: e }, 'billing portal error');
    res.status(500).json({ error: 'Error al abrir portal de facturación' });
  }
});

// GET /api/billing/usage
router.get('/usage', requireAuth, async (req, res) => {
  try {
    const restaurante = await req.prisma.restaurante.findUnique({
      where:  { id: req.user.restaurante_id },
      select: { plan: true, ordenes_mes_actual: true, billing_ciclo_inicio: true },
    });

    const plan    = restaurante.plan || 'free';
    const limits  = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
    const usadas  = restaurante.ordenes_mes_actual || 0;
    const limite  = limits.ordenes_mes === Infinity ? null : limits.ordenes_mes;
    const pct     = limite ? Math.round((usadas / limite) * 100) : 0;

    res.json({
      plan,
      ordenes_usadas:  usadas,
      ordenes_limite:  limite,
      porcentaje:      pct,
      ciclo_inicio:    restaurante.billing_ciclo_inicio,
    });
  } catch (e) {
    logger.error({ err: e }, 'billing usage error');
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
