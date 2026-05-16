import * as XLSX from 'xlsx';

// ── Paleta del tema ──────────────────────────────────────────────────────────
const C = {
  dark:      '1A1A2E',
  purple:    '6C63FF',
  green:     '059669',
  greenText: '10B981',
  amber:     'F59E0B',
  white:     'FFFFFF',
  textDark:  '1E293B',
  textMid:   '475569',
  textLight: '94A3B8',
  bgLight:   'F8FAFC',
  border:    'CBD5E1',
};

const BORDER_ALL = {
  top:    { style: 'thin', color: { rgb: C.border } },
  bottom: { style: 'thin', color: { rgb: C.border } },
  left:   { style: 'thin', color: { rgb: C.border } },
  right:  { style: 'thin', color: { rgb: C.border } },
};

// ── Fábricas de celdas ───────────────────────────────────────────────────────

const mkTitle = v => ({
  v, t: 's',
  s: {
    font:      { bold: true, sz: 13, color: { rgb: C.white }, name: 'Calibri' },
    fill:      { patternType: 'solid', fgColor: { rgb: C.dark } },
    alignment: { horizontal: 'left', vertical: 'center' },
  },
});

const mkSubtitle = v => ({
  v, t: 's',
  s: {
    font:      { sz: 10, italic: true, color: { rgb: C.textMid }, name: 'Calibri' },
    alignment: { horizontal: 'left', vertical: 'center' },
  },
});

const mkSectionHdr = v => ({
  v, t: 's',
  s: {
    font:      { bold: true, sz: 9, color: { rgb: C.white }, name: 'Calibri' },
    fill:      { patternType: 'solid', fgColor: { rgb: C.purple } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border:    BORDER_ALL,
  },
});

const mkColHdr = (v, align = 'center') => ({
  v, t: 's',
  s: {
    font:      { bold: true, sz: 9, color: { rgb: C.white }, name: 'Calibri' },
    fill:      { patternType: 'solid', fgColor: { rgb: C.purple } },
    alignment: { horizontal: align, vertical: 'center', wrapText: true },
    border:    BORDER_ALL,
  },
});

const mkLabel = v => ({
  v, t: 's',
  s: {
    font:      { sz: 9, color: { rgb: C.textMid }, name: 'Calibri' },
    alignment: { horizontal: 'left', vertical: 'center' },
    border:    BORDER_ALL,
  },
});

const mkStr = v => ({
  v: String(v ?? ''), t: 's',
  s: {
    font:      { sz: 9, color: { rgb: C.textMid }, name: 'Calibri' },
    alignment: { horizontal: 'left', vertical: 'center' },
    border:    BORDER_ALL,
  },
});

const mkNum = (v, fmt = '#,##0') => ({
  v: Number(v || 0), t: 'n',
  s: {
    numFmt:    fmt,
    font:      { sz: 9, color: { rgb: C.textDark }, name: 'Calibri' },
    alignment: { horizontal: 'right', vertical: 'center' },
    border:    BORDER_ALL,
  },
});

const mkPct = v => ({
  v: Number(v || 0), t: 'n',
  s: {
    numFmt:    '0.0%',
    font:      { sz: 9, color: { rgb: C.textMid }, name: 'Calibri' },
    alignment: { horizontal: 'right', vertical: 'center' },
    border:    BORDER_ALL,
  },
});

const mkTotalLabel = v => ({
  v, t: 's',
  s: {
    font:      { bold: true, sz: 10, color: { rgb: C.white }, name: 'Calibri' },
    fill:      { patternType: 'solid', fgColor: { rgb: C.green } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border:    BORDER_ALL,
  },
});

const mkTotalNum = (v, fmt = '#,##0') => ({
  v: Number(v || 0), t: 'n',
  s: {
    numFmt:    fmt,
    font:      { bold: true, sz: 10, color: { rgb: C.white }, name: 'Calibri' },
    fill:      { patternType: 'solid', fgColor: { rgb: C.green } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border:    BORDER_ALL,
  },
});

const mkTotalEmpty = () => ({
  v: '', t: 's',
  s: { fill: { patternType: 'solid', fgColor: { rgb: C.green } }, border: BORDER_ALL },
});

// ── Utilidades de hoja ───────────────────────────────────────────────────────

function sc(ws, row, col, cellObj) {
  ws[XLSX.utils.encode_cell({ r: row, c: col })] = cellObj;
}

function merge(ws, r1, c1, r2, c2) {
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
}

// ── HOJA 1 — Resumen del Día ─────────────────────────────────────────────────

const PM_LABELS = {
  efectivo: 'Efectivo', tarjeta: 'Tarjeta',
  transferencia: 'Transferencia', qr: 'QR',
};

function buildResumenSheet(fecha, resumen, ventasList, config) {
  const ws = {};
  const COLS = 5;
  const restaurantName = config?.nombre || config?.restaurantName || 'Mi Restaurante';
  const dateObj        = new Date(fecha + 'T12:00:00');
  const fechaLarga     = dateObj.toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const ticketProm  = resumen.cantidad > 0 ? Math.round(resumen.total / resumen.cantidad) : 0;
  const efectivoTot = Number(resumen.por_metodo?.efectivo || 0);

  // Conteo de transacciones por método
  const countByMethod = {};
  ventasList.forEach(v => {
    countByMethod[v.metodo_pago] = (countByMethod[v.metodo_pago] || 0) + 1;
  });

  let r = 0;

  // Título principal (row 0) — merged A:E
  sc(ws, r, 0, mkTitle(`${restaurantName.toUpperCase()} — REPORTE DE CAJA & VENTAS`));
  merge(ws, r, 0, r, COLS - 1);

  // Fecha (row 1)
  r++;
  sc(ws, r, 0, mkSubtitle(fechaLarga));
  merge(ws, r, 0, r, COLS - 1);

  // Espaciador
  r += 2;

  // ── Sección: Métricas principales ──────────────────────────────────────────
  sc(ws, r, 0, mkSectionHdr('MÉTRICAS PRINCIPALES'));
  merge(ws, r, 0, r, COLS - 1);

  r++;
  sc(ws, r, 0, mkColHdr('Indicador', 'left'));
  sc(ws, r, 1, mkColHdr('Valor', 'right'));

  const metrics = [
    ['Total del día',    resumen.total,    '#,##0'],
    ['N° de Ventas',     resumen.cantidad, '#,##0'],
    ['Ticket Promedio',  ticketProm,       '#,##0'],
    ['Total Efectivo',   efectivoTot,      '#,##0'],
  ];
  metrics.forEach(([label, val, fmt]) => {
    r++;
    sc(ws, r, 0, mkLabel(label));
    sc(ws, r, 1, mkNum(val, fmt));
  });

  // Espaciador
  r += 2;

  // ── Sección: Métodos de pago ────────────────────────────────────────────────
  sc(ws, r, 0, mkSectionHdr('MÉTODOS DE PAGO'));
  merge(ws, r, 0, r, COLS - 1);

  r++;
  ['Método', 'N° Transacciones', 'Monto ($)', 'Porcentaje', ''].forEach((h, c) => {
    if (h) sc(ws, r, c, mkColHdr(h, c === 0 ? 'left' : 'right'));
  });

  const totalMonto = resumen.total || 1;
  Object.entries(resumen.por_metodo || {}).forEach(([m, v]) => {
    r++;
    sc(ws, r, 0, mkLabel(PM_LABELS[m] || m));
    sc(ws, r, 1, mkNum(countByMethod[m] || 0, '#,##0'));
    sc(ws, r, 2, mkNum(Number(v)));
    sc(ws, r, 3, mkPct(Number(v) / totalMonto));
  });

  // Fila total
  r++;
  sc(ws, r, 0, mkTotalLabel('TOTAL FACTURADO'));
  sc(ws, r, 1, mkTotalNum(resumen.cantidad, '#,##0'));
  sc(ws, r, 2, mkTotalNum(resumen.total));
  sc(ws, r, 3, mkTotalNum(1, '0%'));
  sc(ws, r, 4, mkTotalEmpty());

  // Espaciador
  r += 2;

  // Pie de página
  sc(ws, r, 0, {
    v: `Generado por MastexoPOS — ${new Date().toLocaleString('es-CL')}`,
    t: 's',
    s: { font: { sz: 8, italic: true, color: { rgb: C.textLight }, name: 'Calibri' } },
  });
  merge(ws, r, 0, r, COLS - 1);

  ws['!ref']  = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: r, c: COLS - 1 });
  ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 14 }];
  ws['!rows'] = [{ hpx: 34 }, { hpx: 22 }];

  return ws;
}

// ── HOJA 2 — Detalle de Ventas ───────────────────────────────────────────────

function buildDetalleSheet(ventasList, resumen) {
  const ws = {};
  const HDR = ['Ticket', 'Hora', 'Items', 'Método de Pago', 'Cajero', 'Total ($)'];

  let r = 0;
  HDR.forEach((h, c) => sc(ws, r, c, mkColHdr(h, c < 5 ? 'left' : 'right')));

  ventasList.forEach(v => {
    r++;
    const items    = v.items ?? v.venta_items ?? [];
    const itemsStr = items.map(it => `${it.nombre} ×${it.qty ?? it.cantidad ?? 1}`).join(', ');

    sc(ws, r, 0, mkStr(v.ticket_id));
    sc(ws, r, 1, mkStr(v.hora || '—'));
    sc(ws, r, 2, mkStr(itemsStr));
    sc(ws, r, 3, mkStr(PM_LABELS[v.metodo_pago] || v.metodo_pago || '—'));
    sc(ws, r, 4, mkStr(v.cajero || '—'));
    sc(ws, r, 5, mkNum(v.total));
  });

  // Fila TOTAL con fórmula SUM
  r++;
  sc(ws, r, 0, mkTotalLabel('TOTAL'));
  [1, 2, 3, 4].forEach(c => sc(ws, r, c, mkTotalEmpty()));

  const dataRows = ventasList.length;
  sc(ws, r, 5, {
    // v: valor de respaldo si Excel no evalúa la fórmula
    v: Number(resumen.total || 0),
    t: 'n',
    f: dataRows > 0 ? `SUM(F2:F${dataRows + 1})` : '0',
    s: {
      numFmt:    '#,##0',
      font:      { bold: true, sz: 10, color: { rgb: C.white }, name: 'Calibri' },
      fill:      { patternType: 'solid', fgColor: { rgb: C.green } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border:    { ...BORDER_ALL, top: { style: 'double', color: { rgb: '047857' } } },
    },
  });

  ws['!ref']  = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: r, c: 5 });
  ws['!cols'] = [{ wch: 14 }, { wch: 9 }, { wch: 46 }, { wch: 18 }, { wch: 16 }, { wch: 18 }];
  ws['!rows'] = [{ hpx: 28 }];

  return ws;
}

// ── HOJA 3 — Tendencia ───────────────────────────────────────────────────────

function buildTendenciaSheet(chartData, isDemoMode) {
  const ws = {};
  const COLS = 5;
  const periodLabel = isDemoMode ? 'Período' : 'Hora';
  const HDR = ['Día / Hora', periodLabel, 'Total Ventas ($)', 'N° Pedidos est.', 'Ticket Promedio ($)'];

  let r = 0;
  HDR.forEach((h, c) => sc(ws, r, c, mkColHdr(h, c < 2 ? 'left' : 'right')));

  let totalVentas = 0;
  let totalPedidos = 0;

  chartData.forEach(d => {
    r++;
    // Estimación razonable de pedidos desde el monto total
    const pedidosEst = Math.max(1, Math.round(d.sales / 37865));
    const ticket     = Math.round(d.sales / pedidosEst);
    totalVentas  += d.sales;
    totalPedidos += pedidosEst;

    sc(ws, r, 0, mkStr(d.day));
    sc(ws, r, 1, mkStr(isDemoMode ? 'Semana actual' : `${d.day}:00`));
    sc(ws, r, 2, mkNum(d.sales));
    sc(ws, r, 3, mkNum(pedidosEst, '#,##0'));
    sc(ws, r, 4, mkNum(ticket));
  });

  // Fila de totales
  r++;
  const ticketPromTotal = totalPedidos > 0 ? Math.round(totalVentas / totalPedidos) : 0;
  sc(ws, r, 0, mkTotalLabel(isDemoMode ? 'TOTAL SEMANA' : 'TOTAL DÍA'));
  sc(ws, r, 1, mkTotalEmpty());
  sc(ws, r, 2, mkTotalNum(totalVentas));
  sc(ws, r, 3, mkTotalNum(totalPedidos, '#,##0'));
  sc(ws, r, 4, mkTotalNum(ticketPromTotal));

  // Fila de variación (solo demo)
  if (isDemoMode) {
    r++;
    sc(ws, r, 0, {
      v: 'Variación vs semana anterior', t: 's',
      s: {
        font:      { bold: true, sz: 9, color: { rgb: C.greenText }, name: 'Calibri' },
        alignment: { horizontal: 'left' },
      },
    });
    merge(ws, r, 0, r, 1);
    sc(ws, r, 2, {
      v: 0.12, t: 'n',
      s: {
        numFmt:    '+0.0%;-0.0%;0.0%',
        font:      { bold: true, sz: 10, color: { rgb: C.greenText }, name: 'Calibri' },
        alignment: { horizontal: 'right' },
      },
    });
  }

  ws['!ref']  = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: r, c: COLS - 1 });
  ws['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 20 }];
  ws['!rows'] = [{ hpx: 28 }];

  return ws;
}

// ── Función principal de exportación ─────────────────────────────────────────

/**
 * Exporta reporte de caja a .xlsx con 3 hojas.
 * @param {object} opts
 * @param {Array}   opts.ventasList  - Ventas del día (real o demo)
 * @param {string}  opts.fecha       - "YYYY-MM-DD"
 * @param {object}  opts.config      - Config del negocio
 * @param {object}  opts.resumen     - { total, cantidad, por_metodo }
 * @param {Array}   opts.chartData   - [{ day, sales }]
 * @param {boolean} opts.isDemoMode  - Si se usan datos demo
 */
export function exportVentasExcel({ ventasList, fecha, config, resumen, chartData, isDemoMode }) {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, buildResumenSheet(fecha, resumen, ventasList, config),  'Resumen del Día');
  XLSX.utils.book_append_sheet(wb, buildDetalleSheet(ventasList, resumen),                 'Detalle de Ventas');
  XLSX.utils.book_append_sheet(wb, buildTendenciaSheet(chartData, isDemoMode),             'Tendencia');

  XLSX.writeFile(wb, `caja-ventas-${fecha}.xlsx`, { cellStyles: true });
}
