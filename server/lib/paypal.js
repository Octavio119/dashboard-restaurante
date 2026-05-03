const PLAN_IDS = {
  pro:      process.env.PAYPAL_PLAN_ID_PRO,
  business: process.env.PAYPAL_PLAN_ID_BUSINESS,
};

function getBaseUrl() {
  return process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function getPayPalToken() {
  if (process.env.PAYPAL_MOCK === 'true') {
    return 'mock_paypal_token';
  }
  const base = getBaseUrl();
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization:  `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal token error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function crearSuscripcion({ planId, restauranteId, email, returnUrl, cancelUrl }) {
  const base  = getBaseUrl();
  const token = await getPayPalToken();

  const res = await fetch(`${base}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer:         'return=representation',
    },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: String(restauranteId),
      subscriber: { email_address: email },
      application_context: {
        brand_name:          'MastexoPOS',
        locale:              'es-CL',
        shipping_preference: 'NO_SHIPPING',
        user_action:         'SUBSCRIBE_NOW',
        return_url:          returnUrl,
        cancel_url:          cancelUrl,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal subscription error ${res.status}: ${text}`);
  }

  const data        = await res.json();
  const approvalLink = data.links?.find(l => l.rel === 'approve');
  if (!approvalLink) throw new Error('PayPal: approval URL no recibida');

  return { subscriptionId: data.id, approvalUrl: approvalLink.href };
}

async function cancelarSuscripcion(subscriptionId) {
  const base  = getBaseUrl();
  const token = await getPayPalToken();

  const res = await fetch(`${base}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason: 'Customer requested cancellation' }),
  });

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`PayPal cancel error ${res.status}: ${text}`);
  }

  return true;
}

async function verificarWebhook({ headers, body, webhookId }) {
  const base  = getBaseUrl();
  const token = await getPayPalToken();

  const webhookEvent = typeof body === 'string' || Buffer.isBuffer(body)
    ? JSON.parse(body)
    : body;

  const res = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo:         headers['paypal-auth-algo'],
      cert_url:          headers['paypal-cert-url'],
      transmission_id:   headers['paypal-transmission-id'],
      transmission_sig:  headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id:        webhookId,
      webhook_event:     webhookEvent,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal verify error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.verification_status === 'SUCCESS';
}

// ── Orders API (v2) — pago único con capture ───────────────────────────────

const PLAN_PRICES = {
  pro:      '29.00',
  business: '79.00',
};

async function crearOrden({ plan, restauranteId, returnUrl, cancelUrl }) {
  if (process.env.PAYPAL_MOCK === 'true') {
    const mockOrderId = `MOCK-ORD-${restauranteId}-${Date.now()}`;
    // Construimos la URL de retorno incluyendo el token (orderId) que espera el éxito
    const approvalUrl = `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}token=${mockOrderId}`;
    return { orderId: mockOrderId, approvalUrl };
  }
  const base  = getBaseUrl();
  const token = await getPayPalToken();
  const price = PLAN_PRICES[plan];
  if (!price) throw new Error(`Plan desconocido: ${plan}`);

  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        custom_id:   String(restauranteId),
        description: `MastexoPOS Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)} — 1 mes`,
        amount: {
          currency_code: 'USD',
          value:         price,
        },
      }],
      application_context: {
        brand_name:          'MastexoPOS',
        locale:              'es-CL',
        shipping_preference: 'NO_SHIPPING',
        user_action:         'PAY_NOW',
        return_url:          returnUrl,
        cancel_url:          cancelUrl,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal order create error ${res.status}: ${text}`);
  }

  const data        = await res.json();
  const approvalLink = data.links?.find(l => l.rel === 'approve');
  if (!approvalLink) throw new Error('PayPal: approval URL no recibida');

  return { orderId: data.id, approvalUrl: approvalLink.href };
}

async function capturarOrden(orderId) {
  if (process.env.PAYPAL_MOCK === 'true' && orderId.startsWith('MOCK-')) {
    const parts = orderId.split('-');
    const rid = parts[2]; // MOCK-ORD-{rid}-{ts}
    return {
      status: 'COMPLETED',
      id: orderId,
      purchase_units: [{
        custom_id: rid
      }]
    };
  }
  const base  = getBaseUrl();
  const token = await getPayPalToken();

  const res = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal order capture error ${res.status}: ${text}`);
  }

  return await res.json();
}

module.exports = { PLAN_IDS, PLAN_PRICES, getPayPalToken, crearSuscripcion, cancelarSuscripcion, verificarWebhook, crearOrden, capturarOrden };
