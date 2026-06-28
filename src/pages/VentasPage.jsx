import React, { useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import {
  FileText, Download, Plus, Wallet, X, Receipt,
  Banknote, CreditCard, Smartphone, QrCode, Trash2, Printer, Check,
  TrendingUp, BarChart2, ArrowUpRight, AlertCircle, Loader2
} from 'lucide-react';
import { exportVentasPDF }   from '../lib/export-pdf';
import { exportVentasExcel as exportVentasExcelFull } from '../lib/export-excel';
import { jsPDF } from 'jspdf';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { MagicCard } from '../components/ui/magic-card';
import { CosmicButton } from '../components/ui/cosmic-button';
import { RippleButton } from '../components/ui/ripple';
import { DEMO_SALES_DATA, DEMO_VENTAS_RESUMEN } from '../lib/demoData';

// ─── Generate receipt-style PDF ticket (80mm) ────────────────────────────────
function generateTicketPDF(venta, config) {
  const taxAmount = venta.subtotal != null ? (venta.total - venta.subtotal) : 0;
  const showTax   = config.impuestoActivo && taxAmount > 0;
  const currency  = config.currency ?? '$';

  const baseH = 92;
  const itemH = (venta.items ?? venta.venta_items ?? []).length * 6;
  const taxH  = showTax ? 10 : 0;
  const rutH  = config.rut       ? 4 : 0;
  const dirH  = config.direccion ? 4 : 0;
  const cajH  = venta.cajero     ? 4 : 0;
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

  const businessName = config.nombre ?? config.restaurantName ?? 'Mi Restaurante';
  doc.setFont('courier', 'bold');
  center(businessName.toUpperCase(), 11);
  y += 5;

  doc.setFont('courier', 'normal');
  doc.setTextColor(90);
  if (config.rut)       { center(`RUT: ${config.rut}`, 8); y += 4; }
  if (config.direccion) { center(config.direccion, 8);      y += 4; }
  doc.setTextColor(0);

  y += 2; dashed(); y += 5;

  doc.setTextColor(100);
  center(`# ${venta.ticket_id}`, 8);
  y += 4;

  const fecha = venta.fecha ?? new Date().toLocaleDateString('es-CL');
  const hora  = venta.hora  ?? '';
  doc.setFontSize(8);
  doc.text(fecha, LM, y);
  if (hora) doc.text(hora, RM, y, { align: 'right' });
  y += 4;

  if (venta.metodo_pago) { doc.text(`Método: ${venta.metodo_pago}`, LM, y); y += 4; }
  if (venta.cajero)      { doc.text(`Cajero: ${venta.cajero}`, LM, y);      y += 4; }
  doc.setTextColor(0);

  dashed(); y += 5;

  const items = venta.items ?? venta.venta_items ?? [];
  doc.setFont('courier', 'normal');
  for (const it of items) {
    const qty      = it.qty ?? it.cantidad ?? 1;
    const precio   = it.precio_unit ?? it.precio_unitario ?? 0;
    const subtotal = precio * qty;
    row(`${it.nombre} ×${qty}`, `${currency}${subtotal.toFixed(2)}`, 8.5);
    y += 5.5;
  }

  y += 1; dashed(); y += 4;

  if (showTax) {
    doc.setTextColor(110);
    const tax_rate = config.tax_rate ?? config.taxRate ?? 0;
    row('Subtotal', `${currency}${Number(venta.subtotal).toFixed(2)}`, 8); y += 4.5;
    row(`IVA (${tax_rate}%)`, `${currency}${taxAmount.toFixed(2)}`, 8);    y += 4.5;
    doc.setTextColor(0);
  }

  doc.setFont('courier', 'bold');
  row('TOTAL', `${currency}${Number(venta.total).toFixed(2)}`, 11);
  y += 7;
  dashed(); y += 5;

  doc.setFont('courier', 'normal');
  doc.setTextColor(110);
  center('¡Gracias por su visita!', 8);

  doc.save(`ticket-${venta.ticket_id}.pdf`);
}

// ─── Local demo table rows ────────────────────────────────────────────────────
const DEMO_VENTAS_DIA = [
  { id: 'dv1', ticket_id: 'T-0034', items: [{ nombre: 'Lomo Saltado', qty: 2, precio_unit: 18500 }, { nombre: 'Pisco Sour', qty: 2, precio_unit: 5800 }], metodo_pago: 'tarjeta',       cajero: 'María G.',  total: 48600,  hora: '20:45' },
  { id: 'dv2', ticket_id: 'T-0033', items: [{ nombre: 'Ceviche Clásico', qty: 1, precio_unit: 14200 }, { nombre: 'Chardonnay', qty: 1, precio_unit: 12800 }], metodo_pago: 'efectivo', cajero: 'Carlos R.', total: 27000,  hora: '20:31' },
  { id: 'dv3', ticket_id: 'T-0032', items: [{ nombre: 'Parrilla Completa x4', qty: 1, precio_unit: 98000 }, { nombre: 'Cerveza Artesanal', qty: 6, precio_unit: 5500 }], metodo_pago: 'tarjeta', cajero: 'María G.', total: 131000, hora: '19:58' },
  { id: 'dv4', ticket_id: 'T-0031', items: [{ nombre: 'Salmón a la Plancha', qty: 1, precio_unit: 21500 }], metodo_pago: 'transferencia', cajero: 'Carlos R.', total: 21500, hora: '19:42' },
  { id: 'dv5', ticket_id: 'T-0030', items: [{ nombre: 'Menú Ejecutivo', qty: 3, precio_unit: 15800 }], metodo_pago: 'efectivo', cajero: 'Ana P.', total: 47400, hora: '19:15' },
];

// ─── Payment method config ────────────────────────────────────────────────────
const PAYMENT_CFG = {
  efectivo:      { Icon: Banknote,   color: '#10B981', label: 'Efectivo' },
  tarjeta:       { Icon: CreditCard, color: '#3B82F6', label: 'Tarjeta' },
  transferencia: { Icon: Smartphone, color: '#6366F1', label: 'Transferencia' },
  qr:            { Icon: QrCode,     color: '#F59E0B', label: 'QR' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  return hex.slice(1).match(/.{2}/g).map(h => parseInt(h, 16));
}

function AnimatedCount({ value, prefix = '', className = '', style }) {
  const ref = useRef(null);
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(String(value).replace(/[^0-9]/g, ''), 10);
    if (!ref.current) return;
    if (isNaN(num) || num === 0) { ref.current.textContent = prefix + (value || '0'); return; }
    const from = Math.max(0, Math.round(num * 0.55));
    const ctrl = animate(from, num, {
      duration: 0.75,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate(v) { if (ref.current) ref.current.textContent = prefix + Math.round(v).toLocaleString('es-CL'); },
    });
    return ctrl.stop;
  }, [value, prefix]);
  return (
    <span ref={ref} className={`tabular-nums leading-none ${className}`} style={style}>
      {prefix}{typeof value === 'number' ? value.toLocaleString('es-CL') : value}
    </span>
  );
}

function DarkTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(9,9,14,0.97)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px' }}>
      <p className="text-xs font-bold" style={{ color: '#10B981' }}>${Number(payload[0].value).toLocaleString('es-CL')}</p>
      <p className="text-[10px]" style={{ color: '#50506A' }}>{payload[0].payload?.day}</p>
    </div>
  );
}

const rowVariants = {
  hidden:  { opacity: 0, y: 5 },
  visible: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.03, duration: 0.2, ease: [0.16, 1, 0.3, 1] } }),
};

// ─── Inline button helpers ────────────────────────────────────────────────────
const btnPrimary = {
  base: { background: '#7C3AED', color: '#fff' },
  hover: { background: '#6D28D9' },
};

// ─── VentasPage ───────────────────────────────────────────────────────────────
export default function VentasPage({
  ventasFecha, setVentasFecha,
  ventasDia, exportReportePDF, exportVentasExcel,
  setVentaItems, setVentaMetodo, setVentaTicket, setVentaProductos, setVentaModal,
  api, cajaHoy, cajaMonto, setCajaMonto, setCajaModal, cajaModal, cajaLoading, setCajaLoading, setCajaHoy,
  ventasResumen, downloadPDF, printTicket, isAdmin, deleteVenta,
  loadVentasDia, loadVentas,
  ventaItems, ventaProductos, ventaMetodo, config, ventaLoading, setVentaLoading, ventaTicket, ventaModal,
  user
}) {
  const [ventaError, setVentaError] = React.useState(null);
  const [pdfLoading, setPdfLoading]   = React.useState(false);
  const [xlsxLoading, setXlsxLoading] = React.useState(false);
  const plan  = user?.restaurante?.plan?.toLowerCase() ?? 'trial';
  const isPro = plan === 'pro' || plan === 'business';
  const cajaAbierta = cajaHoy?.estado === 'abierta';

  // Guardia defensiva — asegurar que siempre sea array aunque la API cambie de shape
  const safeVentasDia = Array.isArray(ventasDia) ? ventasDia : [];

  // Demo mode — shown when no real data exists for the selected date
  const isDemoMode    = safeVentasDia.length === 0 && ventasResumen.total === 0;
  const displayResumen = isDemoMode ? DEMO_VENTAS_RESUMEN : ventasResumen;
  const displaySales   = isDemoMode ? DEMO_VENTAS_DIA    : safeVentasDia;

  const ticketPromedio = displayResumen.cantidad > 0
    ? Math.round(displayResumen.total / displayResumen.cantidad) : 0;
  const efectivoTotal = Math.round(Number(displayResumen.por_metodo?.efectivo || 0));

  // Chart data: weekly demo OR hourly from real safeVentasDia
  const chartData = useMemo(() => {
    if (isDemoMode) return DEMO_SALES_DATA;
    if (safeVentasDia.length === 0) return [];
    const hours = {};
    safeVentasDia.forEach(v => {
      const h = v.hora ? parseInt(v.hora.split(':')[0], 10) : 12;
      hours[h] = (hours[h] || 0) + Number(v.total);
    });
    return Object.entries(hours)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([h, sales]) => ({ day: `${h}:00`, sales }));
  }, [safeVentasDia, isDemoMode]);

  // KPI cards config
  const kpiCards = [
    { title: 'Total del día', value: displayResumen.total, prefix: '$', icon: TrendingUp, iconColor: '#10B981', large: true },
    { title: 'Ventas',        value: displayResumen.cantidad, prefix: '', icon: Receipt,   iconColor: '#8B5CF6' },
    { title: 'Ticket prom.',  value: ticketPromedio,   prefix: '$', icon: BarChart2,  iconColor: '#3B82F6' },
    { title: 'Efectivo',      value: efectivoTotal,    prefix: '$', icon: Banknote,   iconColor: '#F59E0B' },
  ];

  const handleExportExcel = () => {
    setXlsxLoading(true);
    try {
      exportVentasExcelFull({
        ventasList: displaySales,
        fecha:      ventasFecha,
        config,
        resumen:    displayResumen,
        chartData,
        isDemoMode,
      });
    } finally {
      setXlsxLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      exportVentasPDF({
        ventasList: displaySales,
        fecha: ventasFecha,
        config,
        resumen: displayResumen,
        chartData,
        isDemoMode,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <motion.div
      key="ventas"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="p-4 sm:p-8 flex flex-col gap-8 max-w-[1200px] w-full mx-auto"
    >

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-[3px] rounded-full"
              style={{
                background: cajaAbierta ? 'rgba(16,185,129,.1)' : 'rgba(100,116,139,.1)',
                color:      cajaAbierta ? '#10B981' : '#64748B',
                border:     cajaAbierta ? '1px solid rgba(16,185,129,.2)' : '1px solid rgba(100,116,139,.2)',
              }}
            >
              {cajaAbierta && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />}
              {cajaAbierta ? 'Caja abierta' : 'Caja cerrada'}
            </span>
            {isDemoMode && (
              <span className="text-[10px] px-2 py-[3px] rounded-full font-bold" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.18)' }}>
                datos demo
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
            Caja &amp; <span style={{ color: '#10B981' }}>Ventas</span>
          </h2>
          <p className="text-sm mt-1.5" style={{ color: '#9090B0' }}>Operación financiera del día</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={ventasFecha}
            onChange={e => setVentasFecha(e.target.value)}
            className="input text-sm"
          />
          <button
            onClick={handleExportPDF}
            disabled={pdfLoading}
            className="flex items-center rounded-xl transition-[opacity,transform] duration-150 hover:opacity-85 active:scale-[0.97] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ height: '46px', padding: '0 30px', fontSize: '17px', fontWeight: 600, gap: '8px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '11px', background: 'rgba(255,255,255,0.05)', color: '#9090B0' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.color = '#F8FAFC'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9090B0'; }}
          >
            {pdfLoading
              ? <Loader2 size={18} className="animate-spin"/>
              : <FileText size={18}/>}
            {pdfLoading ? 'Generando...' : 'PDF'}
          </button>
          <button
            onClick={handleExportExcel}
            disabled={xlsxLoading}
            className="flex items-center rounded-xl transition-[opacity,transform] duration-150 hover:opacity-85 active:scale-[0.97] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ height: '46px', padding: '0 30px', fontSize: '17px', fontWeight: 600, gap: '8px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '11px', background: 'rgba(255,255,255,0.05)', color: '#9090B0' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.color = '#F8FAFC'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9090B0'; }}
          >
            {xlsxLoading
              ? <Loader2 size={18} className="animate-spin"/>
              : <Download size={18}/>}
            {xlsxLoading ? 'Generando...' : 'Excel'}
          </button>
          <RippleButton
            onClick={async () => {
              setVentaItems([{ nombre: '', qty: 1, precio_unit: '', producto_id: null }]);
              setVentaMetodo('efectivo');
              setVentaTicket(null);
              setVentaProductos([]);
              setVentaError(null);
              try { const prods = await api.getProductos(); setVentaProductos(prods); }
              catch { setVentaProductos([]); }
              setVentaModal(true);
            }}
            className="flex items-center gap-2 rounded-xl transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97] cursor-pointer"
            style={{ ...btnPrimary.base, height: '44px', padding: '0 24px', fontSize: '15px', fontWeight: 800, boxShadow: '0 4px 14px rgba(124,58,237,0.35)', marginLeft: '12px' }}
            onMouseEnter={e => { e.currentTarget.style.background = btnPrimary.hover.background; }}
            onMouseLeave={e => { e.currentTarget.style.background = btnPrimary.base.background; }}
          >
            <Plus size={18}/> Nueva venta
          </RippleButton>
        </div>
      </div>

      {/* ── Caja Banner ────────────────────────────────────────── */}
      {cajaHoy === null ? (
        <div
          className="flex items-center justify-between gap-4 p-5 rounded-2xl"
          style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <Wallet size={18} style={{ color: '#F59E0B' }}/>
            </div>
            <div>
              <p className="font-bold text-white text-sm">Caja no abierta</p>
              <p className="text-xs mt-0.5" style={{ color: '#50506A' }}>Abre la caja para comenzar a registrar ventas del día</p>
            </div>
          </div>
          <CosmicButton onClick={() => { setCajaMonto(''); setCajaModal('abrir'); }}>
            <Plus size={14}/> Abrir caja
          </CosmicButton>
        </div>
      ) : cajaHoy.estado === 'abierta' ? (
        <div
          className="flex items-center justify-between gap-4 p-5 rounded-2xl flex-wrap"
          style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)' }}
        >
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="relative p-2.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)' }}>
                <Wallet size={18} style={{ color: '#10B981' }}/>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
              </div>
              <div>
                <p className="font-bold text-white text-sm">Caja abierta</p>
                <p className="text-xs mt-0.5" style={{ color: '#50506A' }}>Por {cajaHoy.cajero_apertura}</p>
              </div>
            </div>
            <div className="h-7 w-px hidden sm:block" style={{ background: 'rgba(255,255,255,0.07)' }}/>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#374151' }}>Monto inicial</p>
              <p className="font-black text-amber-400 tabular-nums">${Number(cajaHoy.monto_inicial).toFixed(0)}</p>
            </div>
          </div>
          <button
            onClick={() => { setCajaMonto(''); setCajaModal('cerrar'); }}
            className="flex items-center gap-2 shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
          >
            <X size={14}/> Cerrar caja
          </button>
        </div>
      ) : (
        <div
          className="flex items-center gap-6 p-5 rounded-2xl flex-wrap"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Wallet size={18} style={{ color: '#50506A' }}/>
            </div>
            <div>
              <p className="font-bold text-zinc-300 text-sm">Caja cerrada</p>
              <p className="text-xs mt-0.5" style={{ color: '#50506A' }}>Por {cajaHoy.cajero_cierre}</p>
            </div>
          </div>
          {[
            { label: 'Total ventas',   value: `$${Number(cajaHoy.total_ventas).toFixed(0)}`, color: '#F8FAFC' },
            { label: 'Monto contado',  value: `$${Number(cajaHoy.monto_final).toFixed(0)}`,  color: '#F8FAFC' },
            { label: 'Diferencia',     value: `${cajaHoy.diferencia >= 0 ? '+' : ''}${Number(cajaHoy.diferencia).toFixed(0)}`, color: cajaHoy.diferencia >= 0 ? '#10B981' : '#EF4444' },
          ].map(({ label, value, color }) => (
            <React.Fragment key={label}>
              <div className="h-7 w-px hidden sm:block" style={{ background: 'rgba(255,255,255,0.06)' }}/>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#374151' }}>{label}</p>
                <p className="font-black tabular-nums" style={{ color }}>{value}</p>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {kpiCards.map((card, i) => {
          const [r, g, b] = hexToRgb(card.iconColor);
          return (
            <MagicCard key={i} gradientColor={`rgba(${r},${g},${b},0.06)`} className="cursor-default p-6">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.06, ease: 'easeOut' }}
                className="flex flex-col gap-4"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: `rgba(${r},${g},${b},0.10)` }}
                >
                  <card.icon size={14} style={{ color: card.iconColor }}/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.09em]" style={{ color: 'var(--text-3)' }}>
                    {card.title}
                  </p>
                  <AnimatedCount
                    value={card.value}
                    prefix={card.prefix}
                    className={card.large ? 'text-[34px] font-bold' : 'text-[28px] font-bold'}
                    style={{ color: card.large ? card.iconColor : '#F8FAFC' }}
                  />
                </div>
              </motion.div>
            </MagicCard>
          );
        })}
      </div>

      {/* ── Analytics Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Payment method breakdown */}
        <div style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', background: '#0F0F17', padding: '24px 28px' }}>
          <div className="flex items-center justify-between mb-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.09em]" style={{ color: '#374151' }}>Por método de pago</p>
            {displayResumen.cantidad > 0 && (
              <span className="text-[10px] font-semibold tabular-nums" style={{ color: '#374151' }}>
                {displayResumen.cantidad} venta{displayResumen.cantidad !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {Object.keys(displayResumen.por_metodo || {}).length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2" style={{ color: '#374151' }}>
              <Wallet size={22} style={{ opacity: 0.25 }}/>
              <p className="text-sm">Sin ventas registradas</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {Object.entries(displayResumen.por_metodo || {}).map(([m, v]) => {
                const cfg = PAYMENT_CFG[m] || { Icon: Wallet, color: '#64748B', label: m };
                const pct = displayResumen.total > 0 ? (Number(v) / displayResumen.total) * 100 : 0;
                const [r, g, b] = hexToRgb(cfg.color);
                return (
                  <div key={m}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <cfg.Icon size={11} style={{ color: cfg.color }}/>
                        <span className="text-xs font-semibold" style={{ color: '#9090B0' }}>{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px]" style={{ color: '#50506A' }}>{pct.toFixed(0)}%</span>
                        <span className="text-xs font-bold tabular-nums" style={{ color: '#C0C0D8' }}>
                          ${Number(v).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `rgba(${r},${g},${b},0.08)` }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: cfg.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-between pt-3 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs font-medium" style={{ color: '#374151' }}>Total facturado</span>
                <span className="text-sm font-black tabular-nums" style={{ color: '#10B981' }}>
                  ${displayResumen.total.toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Trend chart */}
        <div style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', background: '#0F0F17', padding: '24px 28px' }}>
          <div className="flex items-center justify-between mb-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.09em]" style={{ color: '#374151' }}>
              {isDemoMode ? 'Tendencia semanal' : 'Ventas por hora'}
            </p>
            {isDemoMode && (
              <span className="text-[10px] px-2 py-[2px] rounded-full font-bold" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.18)' }}>
                demo
              </span>
            )}
          </div>

          {chartData.length > 0 ? (
            <>
              <div style={{ height: 110 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 2, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10B981" stopOpacity={0.18}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <RechartsTooltip content={<DarkTooltip/>} cursor={false}/>
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#10B981"
                      strokeWidth={1.5}
                      fill="url(#salesGrad)"
                      dot={false}
                      activeDot={{ r: 3, fill: '#10B981', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {!isDemoMode && chartData.length > 0 && (
                <div className="flex justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-[10px]" style={{ color: '#50506A' }}>
                    Pico: {chartData.reduce((best, d) => d.sales > best.sales ? d : best, chartData[0])?.day}
                  </span>
                  <span className="text-[10px] font-semibold tabular-nums" style={{ color: '#10B981' }}>
                    ${Math.max(...chartData.map(d => d.sales)).toLocaleString('es-CL')} max
                  </span>
                </div>
              )}
              {isDemoMode && (
                <div className="flex justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-[10px]" style={{ color: '#50506A' }}>Semana actual</span>
                  <div className="flex items-center gap-1" style={{ color: '#10B981' }}>
                    <ArrowUpRight size={11}/>
                    <span className="text-[10px] font-semibold">+12% vs semana anterior</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3" style={{ height: 110 }}>
              <BarChart2 size={22} style={{ color: 'rgba(255,255,255,0.08)' }}/>
              <p className="text-xs" style={{ color: '#374151' }}>Sin datos de tendencia</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Sales Table ────────────────────────────────────────── */}
      <div style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', background: '#0F0F17', overflow: 'hidden' }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-white text-sm">Ventas del {ventasFecha}</h3>
            {isDemoMode && (
              <span className="text-[10px] px-2 py-[2px] rounded-full font-bold" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.18)' }}>
                demo
              </span>
            )}
          </div>
          <span className="text-xs tabular-nums" style={{ color: '#374151' }}>{displaySales.length} ventas</span>
        </div>

        <div className="overflow-x-auto">
          {displaySales.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#374151' }}>
                  <th className="px-6 py-3 text-left font-semibold">Ticket</th>
                  <th className="px-6 py-3 text-left font-semibold">Hora</th>
                  <th className="px-6 py-3 text-left font-semibold">Items</th>
                  <th className="px-6 py-3 text-left font-semibold">Método</th>
                  <th className="px-6 py-3 text-left font-semibold">Cajero</th>
                  <th className="px-6 py-3 text-right font-semibold">Total</th>
                  <th className="px-6 py-3"/>
                </tr>
              </thead>
              <tbody>
                {displaySales.map((v, i) => {
                  const pm = PAYMENT_CFG[v.metodo_pago] || { Icon: Wallet, color: '#64748B', label: v.metodo_pago };
                  const [pr, pg, pb] = hexToRgb(pm.color);
                  return (
                    <motion.tr
                      key={v.id}
                      custom={i}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      className="transition-colors group/row"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.025)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-amber-400 font-black text-xs">{v.ticket_id}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs tabular-nums" style={{ color: '#9090B0' }}>{v.hora || '—'}</span>
                      </td>
                      <td className="px-6 py-3.5 max-w-[220px]">
                        <div className="flex flex-wrap gap-1">
                          {(v.items || []).slice(0, 2).map((it, idx) => (
                            <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.05)', color: '#9090B0' }}>
                              {it.nombre} ×{it.qty ?? it.cantidad}
                            </span>
                          ))}
                          {(v.items || []).length > 2 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.03)', color: '#50506A' }}>
                              +{v.items.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold"
                          style={{ background: `rgba(${pr},${pg},${pb},0.1)`, color: pm.color }}
                        >
                          <pm.Icon size={10}/>
                          {pm.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs" style={{ color: '#9090B0' }}>{v.cajero || '—'}</span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-black text-white tabular-nums">
                        ${Number(v.total).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        {!isDemoMode && (
                          <div className="flex items-center justify-end gap-1.5">
                            {isPro && (
                              <button onClick={() => generateTicketPDF(v, config)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-amber-400 hover:bg-amber-400/10 transition-all cursor-pointer"
                                title="Descargar PDF">
                                <Download size={12}/>
                              </button>
                            )}
                            <button onClick={() => printTicket(v)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-amber-400 hover:bg-amber-400/10 transition-all cursor-pointer"
                              title="Imprimir ticket">
                              <Printer size={12}/>
                            </button>
                            {isAdmin && (
                              <button onClick={() => deleteVenta(v)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
                                title="Anular venta">
                                <Trash2 size={12}/>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.13)' }}>
                <Receipt size={22} style={{ color: 'rgba(16,185,129,0.45)' }}/>
              </div>
              <div className="text-center">
                <p className="font-semibold text-zinc-400">Sin ventas para esta fecha</p>
                <p className="text-xs text-zinc-600 mt-1">Registra una venta para verla aquí</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Caja ─────────────────────────────────────────── */}
      {cajaModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setCajaModal(null)}/>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl p-6 w-full max-w-sm flex flex-col gap-5"
            style={{ background: '#0F0F17', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {cajaModal === 'abrir' ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)' }}>
                    <Wallet size={18} style={{ color: '#F59E0B' }}/>
                  </div>
                  <h3 className="font-black text-white text-lg">Abrir caja</h3>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Monto inicial en caja</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00"
                    value={cajaMonto} onChange={e => setCajaMonto(e.target.value)}
                    className="input text-lg font-bold" autoFocus/>
                  <p className="text-xs" style={{ color: '#50506A' }}>Dinero físico con el que inicia el turno</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCajaModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white transition-colors text-sm font-semibold cursor-pointer">
                    Cancelar
                  </button>
                  <button
                    disabled={cajaLoading || cajaMonto === '' || isNaN(parseFloat(cajaMonto))}
                    onClick={async () => {
                      setCajaLoading(true);
                      try { const c = await api.abrirCaja(parseFloat(cajaMonto)); setCajaHoy(c); setCajaModal(null); }
                      catch(e) { alert(e.message); }
                      finally { setCajaLoading(false); }
                    }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 cursor-pointer"
                    style={btnPrimary.base}
                    onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = btnPrimary.hover.background; }}
                    onMouseLeave={e => { e.currentTarget.style.background = btnPrimary.base.background; }}
                  >
                    {cajaLoading ? 'Abriendo...' : 'Abrir caja'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)' }}>
                    <Wallet size={18} style={{ color: '#EF4444' }}/>
                  </div>
                  <h3 className="font-black text-white text-lg">Cerrar caja</h3>
                </div>

                <div className="rounded-xl p-4 flex flex-col gap-3 text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {[
                    { label: 'Monto inicial',       value: `$${cajaHoy ? Number(cajaHoy.monto_inicial).toFixed(2) : '—'}` },
                    { label: 'Total ventas del día', value: `$${ventasResumen.total.toFixed(2)}` },
                    { label: 'Ventas en efectivo',   value: `$${Number(ventasResumen.por_metodo?.efectivo || 0).toFixed(2)}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-zinc-400">
                      <span>{label}</span>
                      <span className="font-bold text-white">{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 mt-1 text-zinc-400" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <span>Esperado en caja</span>
                    <span className="font-bold text-amber-400">
                      ${(Number(cajaHoy?.monto_inicial || 0) + Number(ventasResumen.por_metodo?.efectivo || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Monto contado en caja</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00"
                    value={cajaMonto} onChange={e => setCajaMonto(e.target.value)}
                    className="input text-lg font-bold" autoFocus/>
                  {cajaMonto !== '' && !isNaN(parseFloat(cajaMonto)) && cajaHoy && (() => {
                    const esperado   = Number(cajaHoy.monto_inicial) + Number(ventasResumen.por_metodo?.efectivo || 0);
                    const diferencia = parseFloat(cajaMonto) - esperado;
                    return (
                      <p className={`text-sm font-bold ${diferencia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        Diferencia: {diferencia >= 0 ? '+' : ''}{diferencia.toFixed(2)}
                      </p>
                    );
                  })()}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setCajaModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white transition-colors text-sm font-semibold cursor-pointer">
                    Cancelar
                  </button>
                  <button
                    disabled={cajaLoading || cajaMonto === '' || isNaN(parseFloat(cajaMonto))}
                    onClick={async () => {
                      setCajaLoading(true);
                      try { const c = await api.cerrarCaja(parseFloat(cajaMonto)); setCajaHoy(c); setCajaModal(null); }
                      catch(e) { alert(e.message); }
                      finally { setCajaLoading(false); }
                    }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 cursor-pointer"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171' }}
                    onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
                  >
                    {cajaLoading ? 'Cerrando...' : 'Cerrar caja'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* ── Modal nueva venta ───────────────────────────────────── */}
      {ventaModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => { setVentaModal(false); setVentaTicket(null); setVentaItems([{ nombre:'', qty:1, precio_unit:'', producto_id: null }]); }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl p-6 w-full max-w-lg flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            style={{ background: '#0F0F17', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {ventaTicket ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)' }}>
                    <Check size={18} style={{ color: '#10B981' }}/>
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg">Venta registrada</h3>
                    <p className="text-zinc-400 text-sm font-mono">{ventaTicket.ticket_id}</p>
                  </div>
                </div>

                <div className="rounded-xl p-5 font-mono text-sm flex flex-col gap-0" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex flex-col items-center gap-1 pb-3 mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {ventaTicket.logo_url && <img src={ventaTicket.logo_url} alt="logo" className="h-10 object-contain mb-1"/>}
                    <p className="font-black text-white text-base tracking-wide">{ventaTicket.restaurante}</p>
                    {ventaTicket.rut       && <p className="text-zinc-500 text-xs">RUT: {ventaTicket.rut}</p>}
                    {ventaTicket.direccion && <p className="text-zinc-500 text-xs">{ventaTicket.direccion}</p>}
                  </div>

                  <div className="flex justify-between text-zinc-400 text-xs pb-3 mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <span>{ventaTicket.fecha}</span><span>{ventaTicket.hora}</span>
                  </div>

                  <div className="flex flex-col gap-1.5 pb-3 mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {ventaTicket.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-zinc-300">
                        <span className="truncate max-w-[180px]">{it.nombre} ×{it.qty}</span>
                        <span>${(it.precio_unit * it.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-zinc-400 text-xs">
                      <span>Subtotal</span><span>${ventaTicket.subtotal.toFixed(2)}</span>
                    </div>
                    {ventaTicket.impuesto_activo && (
                      <div className="flex justify-between text-zinc-500 text-xs">
                        <span>IVA ({ventaTicket.tax_rate}%)</span><span>${ventaTicket.tax_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-white mt-1 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <span>TOTAL</span><span className="text-amber-400">${ventaTicket.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between mt-3 pt-2 text-[10px]" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', color: '#50506A' }}>
                    <span>Pago: {ventaTicket.metodo_pago}</span>
                    <span>Cajero: {ventaTicket.cajero}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => downloadPDF(ventaTicket)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#9090B0' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#F8FAFC'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#9090B0'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  >
                    <Download size={14}/> PDF
                  </button>
                  <button onClick={() => printTicket(ventaTicket)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#9090B0' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#F8FAFC'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#9090B0'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  >
                    <Printer size={14}/> Imprimir
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer"
                    style={btnPrimary.base}
                    onMouseEnter={e => { e.currentTarget.style.background = btnPrimary.hover.background; }}
                    onMouseLeave={e => { e.currentTarget.style.background = btnPrimary.base.background; }}
                    onClick={() => { setVentaModal(false); setVentaTicket(null); setVentaItems([{ nombre:'', qty:1, precio_unit:'', producto_id: null }]); loadVentasDia(); loadVentas(); }}
                  >
                    Cerrar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-white text-lg">Nueva Venta</h3>
                  <button
                    onClick={() => { setVentaModal(false); setVentaTicket(null); setVentaItems([{ nombre:'', qty:1, precio_unit:'', producto_id: null }]); }}
                    className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={18}/>
                  </button>
                </div>

                {/* Items */}
                <div className="flex flex-col gap-2">
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#9CA3AF' }} className="uppercase tracking-wider">Items</label>
                  {ventaItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_60px_80px_32px] gap-2 items-center">
                      {ventaProductos.length > 0 ? (
                        <select
                          value={item.producto_id ?? ''}
                          onChange={e => {
                            const prod = ventaProductos.find(p => p.id === parseInt(e.target.value));
                            setVentaItems(v => v.map((x, i) => i === idx ? {
                              ...x, producto_id: prod ? prod.id : null,
                              nombre: prod ? prod.nombre : '',
                              precio_unit: prod ? prod.precio : x.precio_unit,
                            } : x));
                          }}
                          className="input text-sm bg-zinc-800"
                        >
                          <option value="">— Seleccionar producto —</option>
                          {ventaProductos.map(p => (
                            <option key={p.id} value={p.id} disabled={p.stock === 0}>
                              {p.nombre} {p.stock === 0 ? '(sin stock)' : `(stock: ${p.stock})`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input placeholder="Descripción" value={item.nombre}
                          onChange={e => setVentaItems(v => v.map((x, i) => i === idx ? { ...x, nombre: e.target.value, producto_id: null } : x))}
                          className="input text-sm"/>
                      )}
                      <input type="number" min="1" placeholder="Cant" value={item.qty}
                        onChange={e => setVentaItems(v => v.map((x, i) => i === idx ? { ...x, qty: parseInt(e.target.value) || 1 } : x))}
                        className="input text-sm text-center"/>
                      <input type="number" min="0" step="0.01" placeholder="Precio" value={item.precio_unit}
                        onChange={e => setVentaItems(v => v.map((x, i) => i === idx ? { ...x, precio_unit: e.target.value } : x))}
                        className="input text-sm"/>
                      <button onClick={() => setVentaItems(v => v.filter((_, i) => i !== idx))}
                        className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer" disabled={ventaItems.length === 1}>
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setVentaItems(v => [...v, { nombre:'', qty:1, precio_unit:'', producto_id: null }])}
                    className="text-amber-500 text-xs font-bold hover:text-amber-400 flex items-center gap-1 w-fit mt-1 cursor-pointer"
                  >
                    <Plus size={12}/> Agregar item
                  </button>
                </div>

                {/* Método de pago */}
                <div className="flex flex-col gap-2">
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#9CA3AF' }} className="uppercase tracking-wider">Método de pago</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value:'efectivo',      label:'Efectivo',      icon: Banknote },
                      { value:'tarjeta',       label:'Tarjeta',       icon: CreditCard },
                      { value:'transferencia', label:'Transferencia', icon: Smartphone },
                      { value:'qr',            label:'QR',            icon: QrCode },
                    ].map(({ value, label, icon: Icon }) => (
                      <button key={value} onClick={() => setVentaMetodo(value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors cursor-pointer ${ventaMetodo === value ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]/40 text-[#8B5CF6]' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white'}`}>
                        <Icon size={18}/>
                        <span className="text-[10px] font-bold">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total preview */}
                {(() => {
                  const subtotal  = ventaItems.reduce((s, i) => s + (parseFloat(i.precio_unit) || 0) * (i.qty || 1), 0);
                  const taxAmount = config.impuestoActivo ? subtotal * config.taxRate / 100 : 0;
                  const total     = subtotal + taxAmount;
                  return (
                    <div className="rounded-xl px-5 py-4 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex justify-between text-zinc-400 text-sm">
                        <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                      </div>
                      {config.impuestoActivo && (
                        <div className="flex justify-between text-zinc-500 text-sm">
                          <span>IVA ({config.taxRate}%)</span><span>${taxAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <span className="text-zinc-400 font-semibold text-sm">Total</span>
                        <span className="text-2xl font-black text-amber-400">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}

                {ventaError && (
                  <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#EF4444', display:'flex', gap:'8px', alignItems:'center' }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }}/> {ventaError}
                  </div>
                )}

                <button
                  disabled={ventaLoading || ventaItems.every(i => !i.nombre)}
                  onClick={async () => {
                    const validItems = ventaItems.filter(i => i.nombre && parseFloat(i.precio_unit) > 0);
                    if (validItems.length === 0) return;
                    const total = validItems.reduce((s, i) => s + parseFloat(i.precio_unit) * i.qty, 0);
                    setVentaError(null);
                    setVentaLoading(true);
                    try {
                      const ticket = await api.createVenta({
                        items: validItems.map(i => ({ ...i, precio_unit: parseFloat(i.precio_unit), qty: parseInt(i.qty) })),
                        total,
                        metodo_pago: ventaMetodo,
                      });
                      setVentaTicket(ticket);
                      // Refresh list immediately so new sale appears without stale cache
                      loadVentasDia?.();
                      loadVentas?.();
                    } catch(e) { setVentaError(e.message); }
                    finally { setVentaLoading(false); }
                  }}
                  className="w-full flex items-center justify-center gap-2 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{ ...btnPrimary.base, height: '48px', padding: '0 28px', fontSize: '16px', fontWeight: 700, borderRadius: '12px', background: '#7C3AED', boxShadow: '0 4px 18px rgba(124,58,237,0.4)', width: '100%' }}
                  onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = btnPrimary.hover.background; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#7C3AED'; }}
                >
                  <Receipt size={17}/>
                  {ventaLoading ? 'Registrando...' : 'Registrar venta'}
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}
