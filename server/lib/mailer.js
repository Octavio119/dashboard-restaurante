'use strict';
const nodemailer = require('nodemailer');

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return _transporter;
}

async function sendStockAlert(producto, stockActual) {
  const to = process.env.ALERT_EMAIL;
  if (!to) return;
  const t = getTransporter();
  if (!t) return;
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
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
