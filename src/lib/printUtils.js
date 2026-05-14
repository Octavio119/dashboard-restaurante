import { jsPDF } from 'jspdf';
import { silentPrint } from './silentPrint';

export const printPedido = (order, config) => {
  const hora = order.fecha
    ? new Date(order.fecha).toLocaleTimeString('es-CL', { hour:'2-digit', minute:'2-digit' })
    : new Date().toLocaleTimeString('es-CL', { hour:'2-digit', minute:'2-digit' });
  const fecha = order.fecha
    ? new Date(order.fecha).toLocaleDateString('es-CL')
    : new Date().toLocaleDateString('es-CL');
  silentPrint(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Ticket ${order.numero}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Courier New', monospace; font-size:13px; color:#111; padding:20px; width:320px; }
    h1 { text-align:center; font-size:18px; font-weight:900; margin-bottom:4px; }
    .sub { text-align:center; font-size:11px; color:#555; margin-bottom:12px; }
    hr { border:none; border-top:1px dashed #aaa; margin:10px 0; }
    .row { display:flex; justify-content:space-between; margin:3px 0; }
    .label { color:#555; font-size:11px; }
    .val { font-weight:700; }
    .item-block { margin:6px 0; }
    .total-row { font-size:16px; font-weight:900; display:flex; justify-content:space-between; margin-top:8px; }
    .footer { text-align:center; font-size:10px; color:#888; margin-top:14px; }
    @media print { body { padding:0; } }
  </style>
</head>
<body>
  <h1>${config.restaurantName}</h1>
  <p class="sub">${config.direccion || ''}</p>
  <hr/>
  <div class="row"><span class="label">Pedido</span><span class="val">${order.numero}</span></div>
  <div class="row"><span class="label">Fecha</span><span class="val">${fecha}</span></div>
  <div class="row"><span class="label">Hora</span><span class="val">${hora}</span></div>
  <div class="row"><span class="label">Cliente</span><span class="val">${order.cliente_nombre}</span></div>
  <hr/>
  <div class="item-block">
    <div class="label">Ítems</div>
    <div style="margin-top:4px">${order.item}</div>
  </div>
  <hr/>
  <div class="total-row"><span>TOTAL</span><span>${config.currency}${Number(order.total).toLocaleString('es-CL', { minimumFractionDigits:2 })}</span></div>
  <hr/>
  <p class="footer">Estado: CONFIRMADO &nbsp;|&nbsp; ¡Gracias por su preferencia!</p>
</body>
</html>`);
};

export const printTicket = (venta, config) => {
  const taxAmount  = venta.subtotal != null ? (venta.total - venta.subtotal) : 0;
  const showTax    = config.impuestoActivo && taxAmount > 0;

  const itemsHTML = venta.items.map(it => `
    <tr>
      <td>${it.nombre}</td>
      <td class="center">×${it.qty}</td>
      <td class="right">$${(it.precio_unit * it.qty).toFixed(2)}</td>
    </tr>`).join('');

  const logoHTML = config.logoUrl
    ? `<img src="${config.logoUrl}" alt="logo" style="max-height:48px;max-width:160px;object-fit:contain;margin-bottom:6px"/>`
    : '';

  const taxHTML = showTax ? `
    <tr class="subtotal-row">
      <td colspan="2">Subtotal</td>
      <td class="right">$${venta.subtotal.toFixed(2)}</td>
    </tr>
    <tr class="subtotal-row">
      <td colspan="2">IVA (${config.taxRate}%)</td>
      <td class="right">$${taxAmount.toFixed(2)}</td>
    </tr>` : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Ticket ${venta.ticket_id}</title>
  <style>
    @page { margin: 0; size: 80mm auto; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #111;
      width: 80mm;
      padding: 8mm 6mm 12mm;
    }
    .header { text-align: center; margin-bottom: 10px; }
    .header .biz-name { font-size: 14px; font-weight: bold; letter-spacing: 0.5px; }
    .header .sub { font-size: 10px; color: #555; margin-top: 2px; }
    .divider { border: none; border-top: 1px dashed #aaa; margin: 8px 0; }
    .ticket-id { text-align: center; font-size: 10px; color: #666; margin-bottom: 6px; }
    .meta { display: flex; justify-content: space-between; font-size: 10px; color: #555; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 2px 0; vertical-align: top; }
    td:first-child { width: 55%; }
    td.center { text-align: center; width: 15%; }
    td.right { text-align: right; width: 30%; }
    .subtotal-row td { color: #555; font-size: 10px; padding-top: 3px; }
    .total-row td {
      font-size: 13px; font-weight: bold;
      border-top: 1px solid #111;
      padding-top: 5px; margin-top: 4px;
    }
    .footer { text-align: center; font-size: 10px; color: #888; margin-top: 12px; }
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    ${logoHTML}
    <div class="biz-name">${config.restaurantName}</div>
    ${config.rut      ? `<div class="sub">RUT: ${config.rut}</div>` : ''}
    ${config.direccion? `<div class="sub">${config.direccion}</div>` : ''}
  </div>

  <hr class="divider"/>
  <div class="ticket-id"># ${venta.ticket_id}</div>
  <div class="meta">
    <span>${venta.fecha}</span>
    <span>${venta.hora ?? ''}</span>
  </div>
  <hr class="divider"/>

  <table>
    <tbody>
      ${itemsHTML}
      ${taxHTML}
      <tr class="total-row">
        <td colspan="2">TOTAL</td>
        <td class="right">$${venta.total.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <hr class="divider"/>
  <div class="footer">
    <div>Pago: ${venta.metodo_pago}</div>
    ${venta.cajero ? `<div>Cajero: ${venta.cajero}</div>` : ''}
    <div style="margin-top:8px">¡Gracias por su visita!</div>
  </div>

</body>
</html>`;

  silentPrint(html);
};

export const downloadPDF = (venta, config) => {
  const taxAmount = venta.subtotal != null ? (venta.total - venta.subtotal) : 0;
  const showTax   = config.impuestoActivo && taxAmount > 0;

  const baseH  = 92;
  const itemH  = venta.items.length * 6;
  const taxH   = showTax ? 10 : 0;
  const rutH   = config.rut       ? 4  : 0;
  const dirH   = config.direccion ? 4  : 0;
  const cajH   = venta.cajero     ? 4  : 0;
  const totalH = baseH + itemH + taxH + rutH + dirH + cajH;

  const W  = 80;
  const LM = 6;
  const RM = W - LM;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, totalH] });

  let y = 8;

  const center = (txt, sz = 9) => {
    doc.setFontSize(sz);
    doc.text(String(txt), W / 2, y, { align: 'center' });
  };
  const row = (leftTxt, rightTxt, sz = 9) => {
    doc.setFontSize(sz);
    doc.text(String(leftTxt),  LM, y);
    doc.text(String(rightTxt), RM, y, { align: 'right' });
  };
  const dashed = () => {
    doc.setLineDashPattern([1, 1], 0);
    doc.setDrawColor(160, 160, 160);
    doc.line(LM, y, RM, y);
    doc.setLineDashPattern([], 0);
    doc.setDrawColor(0);
  };

  doc.setFont('courier', 'bold');
  center(config.restaurantName.toUpperCase(), 11);
  y += 5;

  doc.setFont('courier', 'normal');
  doc.setTextColor(90);
  if (config.rut) { center(`RUT: ${config.rut}`, 8); y += 4; }
  if (config.direccion) { center(config.direccion, 8); y += 4; }
  doc.setTextColor(0);

  y += 2; dashed(); y += 5;

  doc.setTextColor(100);
  center(`# ${venta.ticket_id}`, 8);
  y += 4;

  doc.setFontSize(8);
  doc.text(venta.fecha, LM, y);
  doc.text(venta.hora ?? '', RM, y, { align: 'right' });
  y += 4;
  doc.setTextColor(0);

  dashed(); y += 5;

  doc.setFont('courier', 'normal');
  for (const it of venta.items) {
    row(`${it.nombre} ×${it.qty}`, `$${(it.precio_unit * it.qty).toFixed(2)}`, 8.5);
    y += 5.5;
  }

  y += 1; dashed(); y += 4;

  if (showTax) {
    doc.setTextColor(110);
    row('Subtotal', `$${venta.subtotal.toFixed(2)}`, 8);
    y += 4.5;
    row(`IVA (${config.taxRate}%)`, `$${taxAmount.toFixed(2)}`, 8);
    y += 4.5;
    doc.setTextColor(0);
  }

  doc.setFont('courier', 'bold');
  row('TOTAL', `$${venta.total.toFixed(2)}`, 11);
  y += 7;

  dashed(); y += 5;

  doc.setFont('courier', 'normal');
  doc.setTextColor(110);
  center(`Pago: ${venta.metodo_pago}`, 8);
  y += 4;
  if (venta.cajero) { center(`Cajero: ${venta.cajero}`, 8); y += 4; }
  y += 2;
  center('¡Gracias por su visita!', 8);

  doc.save(`ticket-${venta.ticket_id}.pdf`);
};
