'use strict';
const { Resend } = require('resend');

const FROM = 'MastexoPOS <hola@mastexopos.com>';

let _resend = null;

function getClient() {
  if (_resend) return _resend;
  if (!process.env.RESEND_API_KEY) return null;
  _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

async function sendStockAlert(producto, stockActual) {
  const to = process.env.ALERT_EMAIL;
  if (!to) return;
  const resend = getClient();
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `⚠️ Stock bajo: ${producto.nombre}`,
      html: `
        <h2 style="color:#d97706;font-family:sans-serif">⚠️ Alerta de Stock Bajo</h2>
        <p style="font-family:sans-serif">El producto <strong>${producto.nombre}</strong> requiere reposición:</p>
        <table style="border-collapse:collapse;margin-top:12px;font-family:sans-serif">
          <tr>
            <td style="padding:8px 16px;background:#fef3c7;font-weight:bold;border:1px solid #fde68a">Stock actual</td>
            <td style="padding:8px 16px;border:1px solid #e5e7eb">${stockActual} ${producto.unidad || 'uds'}</td>
          </tr>
          <tr>
            <td style="padding:8px 16px;background:#fef3c7;font-weight:bold;border:1px solid #fde68a">Stock mínimo</td>
            <td style="padding:8px 16px;border:1px solid #e5e7eb">${producto.stock_minimo} ${producto.unidad || 'uds'}</td>
          </tr>
        </table>
        <p style="margin-top:16px;color:#6b7280;font-family:sans-serif;font-size:13px">
          Por favor, contacte a su proveedor para reponer el inventario a la brevedad.
        </p>
      `,
    });
  } catch (e) {
    console.error('[Mailer] Error enviando alerta de stock:', e.message);
  }
}

module.exports = { sendStockAlert };
