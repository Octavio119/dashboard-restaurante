import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export const exportCSV = (pedidos, reservas) => {
  const today = new Date().toISOString().split('T')[0];
  const hdr = ['Número','Cliente','Item','Total','Estado','Fecha'];
  const rows = pedidos.map(o => [o.numero, o.cliente_nombre, o.item, o.total, o.estado, o.fecha]);
  const resHdr = ['','Nombre','Hora','Personas','Mesa','Estado','Fecha'];
  const resRows = reservas.map(r => ['', r.nombre, r.hora, r.personas, r.mesa, r.estado, r.fecha]);
  const csv = [
    '=== PEDIDOS ===',
    hdr.join(','),
    ...rows.map(r => r.map(v => `"${v}"`).join(',')),
    '',
    '=== RESERVAS ===',
    resHdr.join(','),
    ...resRows.map(r => r.map(v => `"${v}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `reporte-${today}.csv`;
  a.click();
};

export const exportReportePDF = (ventasList, fecha, config) => {
  if (!ventasList.length) return;
  const W = 210;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, W, 28, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(251, 191, 36);
  doc.text(config.restaurantName || 'Restaurante', 14, 17);
  doc.setFontSize(9);
  doc.setTextColor(160, 160, 160);
  doc.text(`Reporte de Ventas — ${fecha}`, 14, 24);
  doc.setTextColor(0);

  let y = 38;
  const totalVentas = ventasList.reduce((s, v) => s + v.total, 0);
  const porMetodo = ventasList.reduce((acc, v) => { acc[v.metodo_pago] = (acc[v.metodo_pago] || 0) + v.total; return acc; }, {});

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text('RESUMEN', 14, y); y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0);
  [
    [`Transacciones:`, String(ventasList.length)],
    [`Total ventas:`,  `$${totalVentas.toLocaleString('es-CL', { minimumFractionDigits:2 })}`],
    ...Object.entries(porMetodo).map(([k, v]) => [`  Pago ${k}:`, `$${v.toLocaleString('es-CL', { minimumFractionDigits:2 })}`]),
  ].forEach(([label, val]) => {
    doc.text(label, 14, y);
    doc.text(val, 110, y, { align: 'right' });
    y += 5;
  });
  y += 4;

  const headers  = ['TICKET', 'FECHA', 'ITEMS', 'MÉTODO', 'CAJERO', 'TOTAL'];
  const colW     = [34, 24, 64, 22, 28, 22];
  const tableW   = colW.reduce((a, b) => a + b, 0);
  const rowH     = 7;
  const lm       = 14;

  doc.setFillColor(39, 39, 42);
  doc.rect(lm, y, tableW, rowH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(251, 191, 36);
  let x = lm;
  headers.forEach((h, i) => { doc.text(h, x + 2, y + 4.5); x += colW[i]; });
  y += rowH;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  ventasList.forEach((v, ri) => {
    if (y > 272) { doc.addPage(); y = 20; }
    if (ri % 2 === 0) { doc.setFillColor(248, 248, 248); doc.rect(lm, y, tableW, rowH, 'F'); }
    doc.setTextColor(0);
    const itemsStr = v.items.slice(0, 2).map(i => `${i.nombre} ×${i.qty}`).join(', ') + (v.items.length > 2 ? '…' : '');
    const cells = [v.ticket_id, v.fecha, itemsStr, v.metodo_pago, v.cajero || '-', `$${v.total.toLocaleString('es-CL', { minimumFractionDigits:2 })}`];
    x = lm;
    cells.forEach((cell, i) => {
      const txt = doc.splitTextToSize(String(cell || ''), colW[i] - 3)[0] || '';
      doc.text(txt, x + 2, y + 4.5);
      x += colW[i];
    });
    y += rowH;
  });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(150);
  doc.text(`Generado el ${new Date().toLocaleDateString('es-CL')} a las ${new Date().toLocaleTimeString('es-CL', { hour:'2-digit', minute:'2-digit' })}`, 14, 288);

  doc.save(`reporte-ventas-${fecha}.pdf`);
};

export const exportVentasExcel = (ventasList, fecha) => {
  if (!ventasList.length) return;
  const data = ventasList.map(v => ({
    Ticket:    v.ticket_id,
    Fecha:     v.fecha,
    Hora:      v.hora || '',
    Items:     v.items.map(i => `${i.nombre} x${i.qty}`).join(', '),
    Método:    v.metodo_pago,
    Cajero:    v.cajero || '',
    Subtotal:  v.subtotal ?? v.total,
    Total:     v.total,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
  XLSX.writeFile(wb, `ventas-${fecha}.xlsx`);
};

export const exportInventarioExcel = (productosList) => {
  if (!productosList.length) return;
  const data = productosList.map(p => ({
    Nombre:         p.nombre,
    Categoría:      p.categoria,
    Precio:         p.precio,
    Stock:          p.stock,
    'Stock Mínimo': p.stock_minimo,
    Unidad:         p.unidad || '',
    Estado:         p.stock <= p.stock_minimo ? 'CRÍTICO' : p.stock <= p.stock_minimo * 2 ? 'Bajo' : 'OK',
    Activo:         p.activo ? 'Sí' : 'No',
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
  XLSX.writeFile(wb, `inventario-${new Date().toISOString().split('T')[0]}.xlsx`);
};
