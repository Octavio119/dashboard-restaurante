const https  = require('https');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');

const PAYPAL_BASE = () =>
  (process.env.PAYPAL_MODE || 'sandbox') === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

// ── Helpers ────────────────────────────────────────────────────────────────────

function _httpsRaw(url, method, headers, rawBody) {
  return new Promise((resolve, reject) => {
    const u    = new URL(url);
    const body = rawBody || '';
    const req  = https.request({
      hostname: u.hostname,
      path:     u.pathname + (u.search || ''),
      method,
      headers:  { ...headers, ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}) },
    }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try   { resolve({ status: res.statusCode, data: data ? JSON.parse(data) : {} }); }
        catch { resolve({ status: res.statusCode, data: {} }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function _getAccessToken() {
  const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials no configuradas (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET)');
  }
  const auth    = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const body    = 'grant_type=client_credentials';
  const { status, data } = await _httpsRaw(
    `${PAYPAL_BASE()}/v1/oauth2/token`,
    'POST',
    { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  );
  if (status !== 200 || !data.access_token) {
    throw new Error(`PayPal auth failed (${status}): ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function _paypal(method, path, jsonBody, token) {
  const body = jsonBody ? JSON.stringify(jsonBody) : '';
  return _httpsRaw(
    `${PAYPAL_BASE()}${path}`,
    method,
    { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body || undefined,
  );
}

// ── POST /api/payments/paypal/create-order ─────────────────────────────────────

async function createOrder(req, res) {
  try {
    const { pedido_id } = req.body;
    if (!pedido_id) return res.status(400).json({ error: 'pedido_id requerido' });

    const rid    = req.user.restaurante_id;
    const pedido = await prisma.pedido.findFirst({
      where: { id: Number(pedido_id), restaurante_id: rid },
    });
    if (!pedido)                        return res.status(404).json({ error: 'Pedido no encontrado' });
    if (pedido.estado === 'completado') return res.status(409).json({ error: 'El pedido ya fue cobrado' });

    const cfg    = await prisma.configNegocio.findUnique({ where: { restaurante_id: rid } }) || {};
    const amount = Number(pedido.total).toFixed(2);

    const token = await _getAccessToken();
    const { status, data } = await _paypal('POST', '/v2/checkout/orders', {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: `pedido_${pedido_id}`,
        description:  `Pedido ${pedido.numero} — ${pedido.cliente_nombre}`.slice(0, 127),
        amount: { currency_code: 'USD', value: amount },
      }],
      application_context: {
        brand_name:   (cfg.nombre_negocio || 'MastexoPOS').slice(0, 127),
        landing_page: 'NO_PREFERENCE',
        user_action:  'PAY_NOW',
        return_url:   `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?paypal=success`,
        cancel_url:   `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?paypal=cancel`,
      },
    }, token);

    if (status !== 201) {
      logger.warn({ status, data }, 'PayPal create-order failed');
      return res.status(502).json({ error: 'Error al crear orden PayPal' });
    }

    logger.info({ orderId: data.id, pedido_id }, 'PayPal order created');
    res.json({ orderID: data.id });

  } catch (err) {
    logger.error({ err }, 'createOrder error');
    res.status(500).json({ error: 'Error al crear orden de pago' });
  }
}

// ── POST /api/payments/paypal/capture-order ────────────────────────────────────

async function captureOrder(req, res) {
  try {
    const { orderID, pedido_id } = req.body;
    if (!orderID || !pedido_id) return res.status(400).json({ error: 'orderID y pedido_id requeridos' });

    const rid    = req.user.restaurante_id;
    const pedido = await prisma.pedido.findFirst({
      where: { id: Number(pedido_id), restaurante_id: rid },
    });
    if (!pedido)                        return res.status(404).json({ error: 'Pedido no encontrado' });
    if (pedido.estado === 'completado') return res.status(409).json({ error: 'El pedido ya fue cobrado' });

    const token = await _getAccessToken();
    const { status, data } = await _paypal('POST', `/v2/checkout/orders/${orderID}/capture`, {}, token);

    if (status !== 201) {
      logger.warn({ status, data, orderID }, 'PayPal capture failed');
      return res.status(502).json({ error: 'Error al capturar pago PayPal' });
    }

    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
    if (!capture || capture.status !== 'COMPLETED') {
      return res.status(402).json({ error: 'Pago no completado', paypalStatus: capture?.status });
    }

    await prisma.pedido.update({
      where: { id: Number(pedido_id) },
      data: {
        metodo_pago:            'paypal',
        payment_status:         'completed',
        payment_provider:       'paypal',
        payment_transaction_id: capture.id,
        payment_captured_at:    new Date(),
      },
    });

    logger.info({ orderId: orderID, captureId: capture.id, pedido_id }, 'PayPal capture success');
    res.json({ success: true, captureId: capture.id, amount: capture.amount });

  } catch (err) {
    logger.error({ err }, 'captureOrder error');
    res.status(500).json({ error: 'Error al capturar pago' });
  }
}

// ── POST /api/payments/webhook ─────────────────────────────────────────────────

async function handleWebhook(req, res) {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      logger.warn('PAYPAL_WEBHOOK_ID no configurado — omitiendo verificación de firma');
      return res.status(200).json({ received: true });
    }

    const transmissionId   = req.headers['paypal-transmission-id'];
    const transmissionTime = req.headers['paypal-transmission-time'];
    const certUrl          = req.headers['paypal-cert-url'];
    const transmissionSig  = req.headers['paypal-transmission-sig'];
    const authAlgo         = req.headers['paypal-auth-algo'];

    if (!transmissionId || !certUrl || !transmissionSig) {
      logger.warn('PayPal webhook: cabeceras de firma faltantes');
      return res.status(400).json({ error: 'Cabeceras de firma PayPal faltantes' });
    }

    const token = await _getAccessToken();
    const { status: vs, data: vd } = await _paypal('POST', '/v1/notifications/verify-webhook-signature', {
      auth_algo:         authAlgo,
      cert_url:          certUrl,
      transmission_id:   transmissionId,
      transmission_sig:  transmissionSig,
      transmission_time: transmissionTime,
      webhook_id:        webhookId,
      webhook_event:     req.body,
    }, token);

    if (vs !== 200 || vd.verification_status !== 'SUCCESS') {
      logger.warn({ vd }, 'PayPal webhook: firma inválida');
      return res.status(400).json({ error: 'Firma de webhook inválida' });
    }

    const event = req.body;
    logger.info({ eventType: event.event_type }, 'PayPal webhook verificado');

    // PAYMENT.CAPTURE.COMPLETED: capture-order ya actualizó la BD; esto es un safety net.
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      logger.info({ captureId: event.resource?.id }, 'PayPal: capture completado vía webhook');
    }

    res.json({ received: true });

  } catch (err) {
    logger.error({ err }, 'handleWebhook error');
    res.status(500).json({ error: 'Error procesando webhook' });
  }
}

module.exports = { createOrder, captureOrder, handleWebhook };
