/**
 * Thermal ticket printing for MastexoPOS.
 *
 * Strategy: silentPrint() injects a hidden iframe with self-contained HTML.
 * No special drivers needed — works in any browser, any OS.
 * Optimised for 80mm thermal printers (Epson TM series, generic ESC/POS).
 */
import QRCode    from 'qrcode';
import { silentPrint } from './silentPrint';

// ─── Shared CSS embedded in every ticket HTML ─────────────────────────────────
const BASE_CSS = `
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    color: #000;
    width: 80mm;
    padding: 4mm 5mm 8mm;
    background: #fff;
  }
  .dashes  { border: none; border-top: 1px dashed #999; margin: 6px 0; }
  .solid   { border: none; border-top: 2px solid #000; margin: 6px 0; }
  .center  { text-align: center; }
  .right   { text-align: right; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(order) {
  const d  = order.fecha ? new Date(order.fecha) : new Date();
  return {
    hora:  d.toLocaleTimeString('es-CL',  { hour: '2-digit', minute: '2-digit' }),
    fecha: d.toLocaleDateString('es-CL',  { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
    fechaLarga: d.toLocaleDateString('es-CL', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
  };
}

function mesaLabel(order) {
  if (order.mesa) return `Mesa ${order.mesa}`;
  if (order.cliente_nombre) return order.cliente_nombre;
  return '';
}

// ─── Kitchen Comanda HTML ─────────────────────────────────────────────────────
function buildKitchenHTML(order) {
  const { hora, fecha } = fmt(order);
  const numero = order.numero || '#????';

  // Build items — support full items array or legacy string
  let itemsHTML = '';
  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsHTML = order.items.map(it => {
      const notaHTML = it.notas
        ? `<div style="font-size:9px;color:#444;font-style:italic;padding-left:24px;margin-top:1px">★ ${it.notas}</div>`
        : '';
      return `
        <div style="display:flex;gap:6px;align-items:flex-start;margin:6px 0;font-size:13px;font-weight:bold">
          <span style="min-width:22px;font-size:15px;font-weight:900">${it.cantidad}×</span>
          <span style="flex:1">${it.nombre}</span>
        </div>${notaHTML}`;
    }).join('');
  } else if (order.item) {
    itemsHTML = `<div style="margin:6px 0;font-size:12px">${order.item}</div>`;
  } else {
    itemsHTML = `<div style="color:#666;font-size:10px">Sin ítems</div>`;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Comanda ${numero}</title>
  <style>${BASE_CSS}
    .badge { display:block; text-align:center; font-size:9px; font-weight:900; letter-spacing:2px;
      background:#000; color:#fff; padding:3px 0; margin-bottom:4px; }
    .num   { font-size:24px; font-weight:900; text-align:center; letter-spacing:1px; margin:2px 0; }
    .mesa  { font-size:14px; font-weight:bold; text-align:center; margin-bottom:2px; }
    .meta  { font-size:9px; color:#555; text-align:center; margin-bottom:4px; }
  </style>
</head>
<body>
  <div class="badge">★ COMANDA COCINA ★</div>
  <div class="num">${numero}</div>
  <div class="mesa">${mesaLabel(order)}</div>
  <div class="meta">${hora} · ${fecha}</div>
  <hr class="solid"/>
  ${itemsHTML}
  <hr class="dashes"/>
  <div style="text-align:center;font-size:9px;color:#888">
    MastexoPOS · ${new Date().toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})}
  </div>
</body>
</html>`;
}

// ─── Customer Receipt HTML ────────────────────────────────────────────────────
function buildTicketHTML(order, config, qrDataUrl) {
  const { hora, fechaLarga } = fmt(order);
  const numero   = order.numero || '#????';
  const taxRate  = Number(config.taxRate ?? 19);
  const showIVA  = config.impuestoActivo && taxRate > 0;
  const cur      = (n) => `$${Number(n || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}`;

  // Items
  let itemsHTML   = '';
  let subtotalRaw = 0;

  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsHTML = order.items.map(it => {
      const pu    = it.precio_unitario ?? it.precio_unit ?? 0;
      const line  = pu * it.cantidad;
      subtotalRaw += line;
      return `<tr>
        <td style="padding:2px 0;font-size:10.5px">${it.nombre}</td>
        <td style="padding:2px 0;text-align:center;font-size:10.5px">×${it.cantidad}</td>
        <td style="padding:2px 0;text-align:right;font-size:10.5px;font-variant-numeric:tabular-nums">${cur(line)}</td>
      </tr>`;
    }).join('');
  } else if (order.item) {
    subtotalRaw = parseFloat(order.total || 0);
    itemsHTML   = `<tr>
      <td colspan="2" style="padding:2px 0;font-size:10.5px">${order.item}</td>
      <td style="padding:2px 0;text-align:right;font-size:10.5px">${cur(subtotalRaw)}</td>
    </tr>`;
  }

  const totalBruto = parseFloat(order.total || subtotalRaw || 0);
  const ivaAmt     = showIVA ? Math.round(totalBruto - totalBruto / (1 + taxRate / 100)) : 0;
  const subtotal   = totalBruto - ivaAmt;

  const taxRowsHTML = showIVA ? `
    <tr>
      <td colspan="2" style="color:#666;font-size:9.5px;padding:1px 0">Subtotal</td>
      <td style="color:#666;font-size:9.5px;text-align:right;padding:1px 0;font-variant-numeric:tabular-nums">${cur(subtotal)}</td>
    </tr>
    <tr>
      <td colspan="2" style="color:#666;font-size:9.5px;padding:1px 0">IVA (${taxRate}%)</td>
      <td style="color:#666;font-size:9.5px;text-align:right;padding:1px 0;font-variant-numeric:tabular-nums">${cur(ivaAmt)}</td>
    </tr>` : '';

  const logoHTML = config.logoUrl
    ? `<img src="${config.logoUrl}" alt="logo"
         style="max-height:48px;max-width:140px;object-fit:contain;display:block;margin:0 auto 5px"/>`
    : '';

  const qrHTML = qrDataUrl
    ? `<div style="text-align:center;margin-top:10px">
         <img src="${qrDataUrl}" alt="QR" style="width:72px;height:72px"/>
         <div style="font-size:8px;color:#777;margin-top:1px">${numero}</div>
       </div>`
    : '';

  const metodo = order.metodo_pago || order.metodo || '';
  const mensaje = config.mensajeCierre || '¡Gracias por su preferencia!';
  const tel     = config.telefono || '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Ticket ${numero}</title>
  <style>${BASE_CSS}</style>
</head>
<body>
  <!-- Header -->
  <div class="center" style="margin-bottom:8px">
    ${logoHTML}
    <div style="font-size:14px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px">
      ${config.restaurantName || 'Restaurante'}
    </div>
    ${config.rut       ? `<div style="font-size:9px;color:#555">RUT: ${config.rut}</div>` : ''}
    ${config.direccion ? `<div style="font-size:9px;color:#555">${config.direccion}</div>` : ''}
    ${tel              ? `<div style="font-size:9px;color:#555">Tel: ${tel}</div>` : ''}
  </div>

  <hr class="dashes"/>

  <!-- Ticket ID + Meta -->
  <div style="text-align:center;font-size:14px;font-weight:900;margin:3px 0">N° ${numero}</div>
  <div style="display:flex;justify-content:space-between;font-size:9px;color:#555">
    <span>${fechaLarga}</span><span>${hora}</span>
  </div>
  ${mesaLabel(order) ? `<div style="font-size:9.5px;color:#666;margin-top:1px">Mesa / cliente: ${mesaLabel(order)}</div>` : ''}

  <hr class="dashes"/>

  <!-- Items -->
  <table style="width:100%;border-collapse:collapse">
    <tbody>
      ${itemsHTML}
      <tr><td colspan="3" style="padding:3px 0"></td></tr>
      ${taxRowsHTML}
      <!-- Total -->
      <tr>
        <td colspan="2" style="font-size:14px;font-weight:900;border-top:2px solid #000;padding-top:4px">TOTAL</td>
        <td style="font-size:14px;font-weight:900;text-align:right;border-top:2px solid #000;padding-top:4px;font-variant-numeric:tabular-nums">${cur(totalBruto)}</td>
      </tr>
    </tbody>
  </table>

  <hr class="dashes"/>

  <!-- Footer -->
  <div class="center" style="font-size:10px;color:#555">
    ${metodo ? `<div>Forma de pago: ${metodo}</div>` : ''}
    <div style="font-size:11px;font-weight:bold;margin-top:6px">${mensaje}</div>
  </div>

  ${qrHTML}
</body>
</html>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Prints the kitchen comanda (no prices).
 * @param {object} order - pedido object
 */
export async function printKitchenOrder(order) {
  silentPrint(buildKitchenHTML(order));
}

/**
 * Prints the customer receipt with taxes + optional QR code.
 * @param {object} order  - pedido/venta object
 * @param {object} config - useConfig().config
 */
export async function printCustomerTicket(order, config) {
  let qrDataUrl = null;

  if (config.mostrarQR && order.numero) {
    try {
      qrDataUrl = await QRCode.toDataURL(String(order.numero), {
        width: 144, margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
    } catch {
      // QR generation failed — proceed without it
    }
  }

  silentPrint(buildTicketHTML(order, config, qrDataUrl));
}

/**
 * Convenience: choose the right ticket based on order state.
 * Kitchen comanda for active orders; customer receipt for paid/completed.
 */
export async function printAuto(order, config) {
  const paid = ['confirmado', 'pagado', 'completado'];
  if (paid.includes(order.estado)) {
    return printCustomerTicket(order, config);
  }
  return printKitchenOrder(order);
}
