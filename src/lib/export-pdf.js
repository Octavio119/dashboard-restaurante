import { jsPDF } from 'jspdf';

const fmt = n => Number(n || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 });

const PM_COLORS = {
  efectivo:      [16, 185, 129],
  tarjeta:       [59, 130, 246],
  transferencia: [99, 102, 241],
  qr:            [245, 158, 11],
};
const PM_LABELS = {
  efectivo: 'Efectivo', tarjeta: 'Tarjeta',
  transferencia: 'Transferencia', qr: 'QR',
};

/**
 * Exporta el reporte diario de Caja & Ventas a PDF A4.
 * @param {object} opts
 * @param {Array}  opts.ventasList   - Ventas del día (real o demo)
 * @param {string} opts.fecha        - "YYYY-MM-DD"
 * @param {object} opts.config       - Config del negocio (nombre, etc.)
 * @param {object} opts.resumen      - { total, cantidad, por_metodo }
 * @param {Array}  opts.chartData    - [{ day, sales }]
 * @param {boolean} opts.isDemoMode  - Si se están mostrando datos demo
 */
export function exportVentasPDF({ ventasList, fecha, config, resumen, chartData, isDemoMode }) {
  const W = 210;
  const LM = 14;
  const RM = W - LM;
  const CW = RM - LM;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const restaurantName = config?.nombre || config?.restaurantName || 'Mi Restaurante';

  // ═══════════════════════════════════════════════════════════════
  // HEADER — fondo oscuro con acento verde
  // ═══════════════════════════════════════════════════════════════
  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, W, 37, 'F');

  doc.setFillColor(16, 185, 129);
  doc.rect(0, 37, W, 1.5, 'F');

  // Logo textual "MastexoPOS"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(255, 255, 255);
  doc.text('Mastexo', LM, 16);
  const mastexoW = doc.getTextWidth('Mastexo');
  doc.setTextColor(16, 185, 129);
  doc.text('POS', LM + mastexoW, 16);

  // Nombre del restaurante
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(160, 160, 200);
  doc.text(restaurantName, LM, 24);

  // Título del reporte
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(230, 232, 255);
  doc.text('Reporte de Caja & Ventas', LM, 31.5);

  // Fecha (derecha)
  const dateObj = new Date(fecha + 'T12:00:00');
  const fechaLarga = dateObj.toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129);
  doc.text(fechaLarga, RM, 24, { align: 'right' });

  if (isDemoMode) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(245, 158, 11);
    doc.text('DATOS DEMO', RM, 31.5, { align: 'right' });
  }

  let y = 48;

  // ═══════════════════════════════════════════════════════════════
  // KPI CARDS — 4 tarjetas en fila
  // ═══════════════════════════════════════════════════════════════
  const GAP = 4;
  const CARD_W = (CW - GAP * 3) / 4;
  const CARD_H = 24;

  const ticketProm = resumen.cantidad > 0 ? Math.round(resumen.total / resumen.cantidad) : 0;

  const kpis = [
    { label: 'Total del día', value: `$${fmt(resumen.total)}`,                     accent: [16, 185, 129] },
    { label: 'Ventas',        value: String(resumen.cantidad),                      accent: [139, 92, 246] },
    { label: 'Ticket Prom.',  value: `$${fmt(ticketProm)}`,                        accent: [59, 130, 246] },
    { label: 'Efectivo',      value: `$${fmt(resumen.por_metodo?.efectivo || 0)}`, accent: [245, 158, 11] },
  ];

  kpis.forEach((k, i) => {
    const cx = LM + i * (CARD_W + GAP);
    const [r, g, b] = k.accent;

    doc.setFillColor(247, 248, 250);
    doc.setDrawColor(215, 218, 224);
    doc.setLineWidth(0.2);
    doc.roundedRect(cx, y, CARD_W, CARD_H, 2, 2, 'FD');

    doc.setFillColor(r, g, b);
    doc.rect(cx, y, CARD_W, 2.5, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(110, 118, 135);
    doc.text(k.label.toUpperCase(), cx + 4, y + 9.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(i === 0 ? 10.5 : 9.5);
    doc.setTextColor(r, g, b);
    doc.text(k.value, cx + 4, y + 19);
  });

  y += CARD_H + 8;

  // ═══════════════════════════════════════════════════════════════
  // ANALYTICS ROW — Métodos de pago | Tendencia
  // ═══════════════════════════════════════════════════════════════
  const SECTION_H = 58;
  const HALF_W = (CW - 4) / 2;

  // ── Panel: Métodos de pago ─────────────────────────────────────
  const pmX = LM;
  doc.setFillColor(247, 248, 250);
  doc.setDrawColor(215, 218, 224);
  doc.setLineWidth(0.2);
  doc.roundedRect(pmX, y, HALF_W, SECTION_H, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(110, 118, 135);
  doc.text('POR MÉTODO DE PAGO', pmX + 5, y + 8);

  const total = resumen.total || 1;
  const barAvail = HALF_W - 12;
  let pmY = y + 15;

  Object.entries(resumen.por_metodo || {}).forEach(([m, v]) => {
    const [r, g, b] = PM_COLORS[m] || [100, 116, 139];
    const label = PM_LABELS[m] || m;
    const pct = Number(v) / total;

    doc.setFillColor(r, g, b);
    doc.circle(pmX + 7, pmY - 0.8, 1.3, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(40, 50, 70);
    doc.text(label, pmX + 11, pmY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(r, g, b);
    doc.text(`${(pct * 100).toFixed(0)}%`, pmX + HALF_W - 5, pmY, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(90, 100, 120);
    doc.text(`$${fmt(v)}`, pmX + 11, pmY + 4.2);

    // Barra — fondo gris
    doc.setFillColor(210, 215, 222);
    doc.roundedRect(pmX + 5, pmY + 6, barAvail, 2.3, 1, 1, 'F');
    // Barra — relleno color
    doc.setFillColor(r, g, b);
    doc.roundedRect(pmX + 5, pmY + 6, Math.max(barAvail * pct, 2), 2.3, 1, 1, 'F');

    pmY += 14;
  });

  // Línea total
  doc.setDrawColor(215, 218, 224);
  doc.setLineWidth(0.3);
  doc.line(pmX + 5, y + SECTION_H - 10, pmX + HALF_W - 5, y + SECTION_H - 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(50, 60, 80);
  doc.text('Total facturado', pmX + 5, y + SECTION_H - 4);
  doc.setTextColor(16, 140, 100);
  doc.text(`$${fmt(resumen.total)}`, pmX + HALF_W - 5, y + SECTION_H - 4, { align: 'right' });

  // ── Panel: Gráfico de tendencia (vectorial) ────────────────────
  const chartX = LM + HALF_W + 4;
  doc.setFillColor(247, 248, 250);
  doc.setDrawColor(215, 218, 224);
  doc.setLineWidth(0.2);
  doc.roundedRect(chartX, y, HALF_W, SECTION_H, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(110, 118, 135);
  doc.text(isDemoMode ? 'TENDENCIA SEMANAL' : 'VENTAS POR HORA', chartX + 5, y + 8);

  const cPad = 6;
  const cInnerX = chartX + cPad;
  const cInnerY = y + 13;
  const cInnerW = HALF_W - cPad * 2;
  const cInnerH = SECTION_H - 26;
  const cBaseY = cInnerY + cInnerH;

  if (chartData.length >= 2) {
    const maxSales = Math.max(...chartData.map(d => d.sales), 1);

    // Grid horizontal (punteado)
    doc.setDrawColor(210, 215, 222);
    doc.setLineWidth(0.2);
    [0.33, 0.67, 1].forEach(pct => {
      const gy = cBaseY - cInnerH * pct;
      doc.setLineDashPattern([1, 1.5], 0);
      doc.line(cInnerX, gy, cInnerX + cInnerW, gy);
    });
    doc.setLineDashPattern([], 0);

    // Etiquetas Y (max y 50%)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(155, 165, 185);
    [0.5, 1].forEach(pct => {
      const val = Math.round(maxSales * pct / 1000);
      doc.text(`$${val}k`, cInnerX - 1, cBaseY - cInnerH * pct + 1.5, { align: 'right' });
    });

    // Puntos del gráfico
    const pts = chartData.map((d, i) => ({
      x: cInnerX + (i / (chartData.length - 1)) * cInnerW,
      y: cBaseY - (d.sales / maxSales) * cInnerH,
    }));

    // Área (rectángulos delgados simulando fill)
    for (let i = 0; i < pts.length - 1; i++) {
      const steps = 5;
      for (let s = 0; s < steps; s++) {
        const t1 = s / steps, t2 = (s + 1) / steps;
        const x1 = pts[i].x + t1 * (pts[i + 1].x - pts[i].x);
        const x2 = pts[i].x + t2 * (pts[i + 1].x - pts[i].x);
        const topY = pts[i].y + t1 * (pts[i + 1].y - pts[i].y);
        doc.setFillColor(200, 235, 218);
        doc.rect(x1, topY, x2 - x1 + 0.3, cBaseY - topY, 'F');
      }
    }

    // Línea del gráfico
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.9);
    for (let i = 0; i < pts.length - 1; i++) {
      doc.line(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
    }

    // Puntos (círculos con borde blanco)
    pts.forEach(pt => {
      doc.setFillColor(247, 248, 250);
      doc.circle(pt.x, pt.y, 1.4, 'F');
      doc.setFillColor(16, 185, 129);
      doc.circle(pt.x, pt.y, 0.9, 'F');
    });

    // Etiquetas X (máximo 4)
    const labelStep = Math.ceil(chartData.length / 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(130, 140, 160);
    chartData.forEach((d, i) => {
      if (i === 0 || i === chartData.length - 1 || i % labelStep === 0) {
        const lx = cInnerX + (i / (chartData.length - 1)) * cInnerW;
        doc.text(d.day, lx, cBaseY + 5.5, { align: 'center' });
      }
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(160, 170, 190);
    doc.text('Sin datos de tendencia', chartX + HALF_W / 2, y + SECTION_H / 2, { align: 'center' });
  }

  // Badge +12% (solo demo)
  if (isDemoMode) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(16, 140, 100);
    doc.text('+12% vs semana anterior', chartX + HALF_W - 5, y + SECTION_H - 4, { align: 'right' });
  }

  y += SECTION_H + 8;

  // ═══════════════════════════════════════════════════════════════
  // TABLA DE VENTAS
  // ═══════════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 40, 60);
  doc.text(`Ventas del ${dateObj.toLocaleDateString('es-CL')}`, LM, y + 1);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(130, 140, 160);
  doc.text(`${ventasList.length} transacciones`, RM, y + 1, { align: 'right' });
  y += 6;

  const COL_WIDTHS = [27, 13, 63, 22, 26, 27];
  const COL_HDRS   = ['TICKET', 'HORA', 'ITEMS', 'MÉTODO', 'CAJERO', 'TOTAL'];
  const TABLE_W    = COL_WIDTHS.reduce((a, b) => a + b, 0);
  const ROW_H      = 6.5;

  const drawTHead = (startY) => {
    doc.setFillColor(26, 26, 46);
    doc.rect(LM, startY, TABLE_W, ROW_H, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(130, 135, 175);
    let x = LM;
    COL_HDRS.forEach((h, i) => {
      doc.text(h, x + 3, startY + 4.5);
      x += COL_WIDTHS[i];
    });
    return startY + ROW_H;
  };

  y = drawTHead(y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  ventasList.forEach((v, ri) => {
    if (y > 272) {
      doc.addPage();
      y = 16;
      y = drawTHead(y);
    }

    if (ri % 2 === 1) {
      doc.setFillColor(247, 248, 250);
      doc.rect(LM, y, TABLE_W, ROW_H, 'F');
    }

    const items = v.items ?? v.venta_items ?? [];
    const itemsStr = items.slice(0, 2)
      .map(it => `${it.nombre} ×${it.qty ?? it.cantidad ?? 1}`)
      .join(', ')
      + (items.length > 2 ? ` +${items.length - 2}` : '');

    const [pmR, pmG, pmB] = PM_COLORS[v.metodo_pago] || [100, 116, 139];

    const cells = [
      { val: v.ticket_id,                      color: [175, 125, 20], bold: true },
      { val: v.hora || '—',                    color: [120, 130, 150] },
      { val: itemsStr,                          color: [55,  65,  85] },
      { val: PM_LABELS[v.metodo_pago] || v.metodo_pago || '—', color: [pmR, pmG, pmB] },
      { val: v.cajero || '—',                  color: [120, 130, 150] },
      { val: `$${fmt(v.total)}`,               color: [14,  120, 80],  bold: true },
    ];

    let x = LM;
    cells.forEach((cell, ci) => {
      doc.setFont('helvetica', cell.bold ? 'bold' : 'normal');
      doc.setTextColor(...cell.color);
      const txt = doc.splitTextToSize(String(cell.val || ''), COL_WIDTHS[ci] - 4)[0] || '';
      doc.text(txt, x + 3, y + 4.5);
      x += COL_WIDTHS[ci];
    });
    y += ROW_H;
  });

  // Fila de total
  doc.setDrawColor(215, 218, 224);
  doc.setLineWidth(0.3);
  doc.line(LM, y, LM + TABLE_W, y);
  y += 2;
  doc.setFillColor(240, 250, 245);
  doc.rect(LM, y, TABLE_W, ROW_H + 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 40, 60);
  doc.text(`${ventasList.length} ventas`, LM + 3, y + 5);
  doc.setTextColor(14, 120, 80);
  doc.text(`$${fmt(resumen.total)}`, LM + TABLE_W - 3, y + 5, { align: 'right' });

  // ═══════════════════════════════════════════════════════════════
  // FOOTER — se repite en cada página
  // ═══════════════════════════════════════════════════════════════
  const pageCount = doc.getNumberOfPages();
  const ts = new Date().toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(215, 218, 224);
    doc.setLineWidth(0.3);
    doc.line(LM, 283, RM, 283);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(150, 160, 180);
    doc.text(`Generado por MastexoPOS — ${ts}`, LM, 289);
    doc.text(`Página ${p} de ${pageCount}`, RM, 289, { align: 'right' });
  }

  doc.save(`caja-ventas-${fecha}.pdf`);
}
