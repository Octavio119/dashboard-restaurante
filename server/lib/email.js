'use strict';
const { Resend } = require('resend');
const logger = require('./logger');

const FROM = 'MastexoPOS <hola@mastexopos.com>';
const APP_URL = 'https://mastexopos.com';

let _resend = null;

function getClient() {
  if (_resend) return _resend;
  if (!process.env.RESEND_API_KEY) return null;
  _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

// ─── Layout compartido ───────────────────────────────────────────────────────
function wrapEmail({ preheader, body }) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#0F0E1A;padding:32px 16px;">
      <span style="display:none;max-height:0;overflow:hidden;">${preheader || ''}</span>
      <div style="max-width:520px;margin:0 auto;background:#16142A;border-radius:16px;padding:36px 32px;">
        <p style="margin:0 0 24px;font-weight:700;font-size:18px;color:#fff;">
          Mastexo<span style="color:#8B5CF6;">POS</span>
        </p>
        ${body}
        <p style="margin:32px 0 0;font-size:13px;color:#6B6B88;">
          El equipo de MastexoPOS
        </p>
      </div>
    </div>
  `;
}

function ctaButton(label, href, color = '#10B981') {
  return `
    <a href="${href}" style="display:inline-block;margin:20px 0;padding:14px 28px;background:${color};color:#fff;font-weight:700;font-size:15px;text-decoration:none;border-radius:10px;">
      ${label}
    </a>
  `;
}

// ─── Día 0 — bienvenida ───────────────────────────────────────────────────────
async function sendWelcomeEmail(to, nombre, restaurante) {
  const resend = getClient();
  if (!resend) { logger.warn('RESEND_API_KEY no configurada — sendWelcomeEmail omitido'); return; }
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: '¡Bienvenido a MastexoPOS! Tu prueba de 14 días empieza hoy',
      html: wrapEmail({
        preheader: `${nombre}, tu restaurante ${restaurante} ya está listo en MastexoPOS.`,
        body: `
          <h1 style="margin:0 0 16px;font-size:22px;color:#fff;">Hola ${nombre} 👋</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#C8C8D8;">
            Tu restaurante <strong style="color:#fff;">${restaurante}</strong> ya está configurado en MastexoPOS.
            Tienes <strong style="color:#fff;">14 días de prueba</strong> con acceso completo, sin tarjeta de crédito.
          </p>
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#fff;">Durante tu prueba tienes disponible:</p>
          <ul style="margin:0 0 8px;padding-left:20px;font-size:14px;line-height:1.8;color:#C8C8D8;">
            <li>Pedidos ilimitados</li>
            <li>Analytics avanzado</li>
            <li>PDF de tickets</li>
            <li>Soporte incluido</li>
          </ul>
          ${ctaButton('Ir a mi dashboard', `${APP_URL}/dashboard`)}
        `,
      }),
    });
  } catch (e) {
    logger.error({ err: e }, 'sendWelcomeEmail error');
  }
}

// ─── Día 11 — advertencia ─────────────────────────────────────────────────────
async function sendTrialWarningEmail(to, nombre, diasRestantes) {
  const resend = getClient();
  if (!resend) { logger.warn('RESEND_API_KEY no configurada — sendTrialWarningEmail omitido'); return; }
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `⚠️ Te quedan ${diasRestantes} días de prueba en MastexoPOS`,
      html: wrapEmail({
        preheader: `Tu período de prueba vence en ${diasRestantes} días, ${nombre}.`,
        body: `
          <h1 style="margin:0 0 16px;font-size:22px;color:#fff;">Hola ${nombre}</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#C8C8D8;">
            Tu período de prueba vence en <strong style="color:#F59E0B;">${diasRestantes} días</strong>.
            Para no perder el acceso, elige tu plan.
          </p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr>
              <td style="padding:16px;background:#1F1B3A;border:1px solid rgba(139,92,246,.25);border-radius:10px 0 0 10px;width:50%;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#fff;">Pro — $22/mes</p>
                <p style="margin:0;font-size:13px;color:#A1A1AA;">Pedidos ilimitados, 1 local</p>
              </td>
              <td style="width:8px;"></td>
              <td style="padding:16px;background:#1F1B3A;border:1px solid rgba(139,92,246,.25);border-radius:0 10px 10px 0;width:50%;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#fff;">Business — $49/mes</p>
                <p style="margin:0;font-size:13px;color:#A1A1AA;">Hasta 5 locales</p>
              </td>
            </tr>
          </table>
          ${ctaButton('Elegir mi plan', `${APP_URL}/dashboard/billing`, '#8B5CF6')}
          <p style="margin:8px 0 0;font-size:13px;color:#6B6B88;">
            Sin tarjeta guardada — sin cobros sorpresa.
          </p>
        `,
      }),
    });
  } catch (e) {
    logger.error({ err: e }, 'sendTrialWarningEmail error');
  }
}

// ─── Día 14 — vencido ─────────────────────────────────────────────────────────
async function sendTrialExpiredEmail(to, nombre) {
  const resend = getClient();
  if (!resend) { logger.warn('RESEND_API_KEY no configurada — sendTrialExpiredEmail omitido'); return; }
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Tu prueba de MastexoPOS venció — reactiva tu cuenta',
      html: wrapEmail({
        preheader: `${nombre}, tu período de prueba terminó. Tus datos están guardados.`,
        body: `
          <h1 style="margin:0 0 16px;font-size:22px;color:#fff;">Hola ${nombre}</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#C8C8D8;">
            Tu período de prueba terminó. <strong style="color:#fff;">Tus datos están guardados —
            no perdiste nada.</strong> Elige un plan para continuar donde lo dejaste.
          </p>
          ${ctaButton('Reactivar mi cuenta', `${APP_URL}/dashboard/billing`, '#8B5CF6')}
          <p style="margin:20px 0 0;padding:12px 16px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;font-size:13px;color:#FCA5A5;">
            Si no eliges un plan en los próximos 30 días, tu cuenta será eliminada.
          </p>
        `,
      }),
    });
  } catch (e) {
    logger.error({ err: e }, 'sendTrialExpiredEmail error');
  }
}

// ─── Comprobante de transferencia bancaria ───────────────────────────────────
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

const PAYMENT_PROOF_TO = 'octaviofararene@gmail.com';

async function sendPaymentProofEmail({ plan, monto, nombre, email, restaurante, comprobante }) {
  const resend = getClient();
  if (!resend) { logger.warn('RESEND_API_KEY no configurada — sendPaymentProofEmail omitido'); return false; }

  // comprobante llega como data URL ("data:image/png;base64,...."): separamos
  // el mime type (para el nombre de archivo) del contenido base64 que espera Resend.
  const match   = /^data:(.+);base64,(.+)$/.exec(comprobante || '');
  const mime    = match ? match[1] : 'application/octet-stream';
  const content = match ? match[2] : comprobante;
  const ext     = mime.split('/')[1] || 'bin';

  try {
    await resend.emails.send({
      from: FROM,
      to: PAYMENT_PROOF_TO,
      subject: `💰 Nuevo pago - ${restaurante} - Plan ${plan}`,
      html: wrapEmail({
        preheader: `${nombre} envió un comprobante de transferencia — Plan ${plan}.`,
        body: `
          <h1 style="margin:0 0 16px;font-size:22px;color:#fff;">💰 Nuevo comprobante de pago</h1>
          <table style="width:100%;border-collapse:collapse;margin:0 0 16px;font-size:14px;">
            <tr>
              <td style="padding:8px 0;color:#9D9DB8;width:140px;">Restaurante</td>
              <td style="padding:8px 0;color:#fff;font-weight:600;">${escapeHtml(restaurante)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#9D9DB8;">Usuario</td>
              <td style="padding:8px 0;color:#fff;">${escapeHtml(nombre)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#9D9DB8;">Email</td>
              <td style="padding:8px 0;color:#fff;">${escapeHtml(email)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#9D9DB8;">Plan</td>
              <td style="padding:8px 0;color:#fff;font-weight:600;">${escapeHtml(plan)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#9D9DB8;">Monto</td>
              <td style="padding:8px 0;color:#10B981;font-weight:700;">$${escapeHtml(monto)}</td>
            </tr>
          </table>
          <p style="margin:0;font-size:13px;color:#6B6B88;">Comprobante adjunto en este correo.</p>
        `,
      }),
      attachments: [{ filename: `comprobante.${ext}`, content }],
    });
    return true;
  } catch (e) {
    logger.error({ err: e }, 'sendPaymentProofEmail error');
    return false;
  }
}

module.exports = {
  sendWelcomeEmail, sendTrialWarningEmail, sendTrialExpiredEmail, sendPaymentProofEmail,
};
