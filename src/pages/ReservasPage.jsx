import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DotPattern } from '../components/ui/dot-pattern';
import {
  ChevronLeft, ChevronRight, Plus, Users, Phone, Utensils,
  Check, X, RefreshCw, MessageCircle, Trash2, ShoppingBag,
  ChefHat, AlertCircle, Clock, UserCheck, MapPin, LayoutGrid,
  Calendar, List
} from 'lucide-react';

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:        '#0D0D0F',
  card:      '#161618',
  card2:     '#1A1A1D',
  border:    '#27272A',
  borderDim: '#1E1E22',
  text:      '#E8E8EA',
  textMuted: '#888',
  textDim:   '#52525B',
  textGhost: '#3F3F46',
  purple:    '#7C3AED',
  purpleDim: 'rgba(124,58,237,0.12)',
  purpleBdr: 'rgba(124,58,237,0.25)',
  // Green — border accent vs label vs capacity text
  greenBorder:   '#16A34A',
  green:         '#4ADE80',
  greenCapacity: '#86EFAC',
  greenDim:      '#052912',
  greenBdr:      'rgba(22,163,74,0.15)',
  // Orange
  orangeBorder:   '#D97706',
  orange:         '#FCD34D',
  orangeCapacity: '#FDE68A',
  orangeDim:      '#1C1007',
  orangeBdr:      'rgba(217,119,6,0.15)',
  // Red
  redBorder:   '#DC2626',
  red:         '#F87171',
  redCapacity: '#FECACA',
  redDim:      '#1A0707',
  redBdr:      'rgba(220,38,38,0.15)',
  // Blue
  blueBorder:   '#2563EB',
  blue:         '#60A5FA',
  blueCapacity: '#BFDBFE',
  blueDim:      '#050E1F',
  blueBdr:      'rgba(37,99,235,0.15)',
  whatsapp:  '#25D366',
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  confirmada: { label: 'Confirmada', color: T.green,  bg: T.greenDim,  border: T.greenBorder,  borderAlpha: T.greenBdr  },
  pendiente:  { label: 'Pendiente',  color: T.orange, bg: T.orangeDim, border: T.orangeBorder, borderAlpha: T.orangeBdr },
  cancelada:  { label: 'Cancelada',  color: T.red,    bg: T.redDim,    border: T.redBorder,    borderAlpha: T.redBdr    },
  'asistió':  { label: 'Asistió',    color: T.blue,   bg: T.blueDim,   border: T.blueBorder,   borderAlpha: T.blueBdr   },
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_RESERVAS = [
  { id: 1, nombre: 'Isabella Moreno', telefono: '+56912345678', mesa: 'Mesa 4', personas: 4, hora: '12:30', fecha: '2026-05-13', estado: 'confirmada', notas: 'Cumpleaños, mesa junto a ventana' },
  { id: 2, nombre: 'Carlos Vega',     telefono: '+56987654321', mesa: 'Mesa 7', personas: 2, hora: '13:00', fecha: '2026-05-13', estado: 'pendiente',  notas: '' },
  { id: 3, nombre: 'Ana Pérez',       telefono: '+56911223344', mesa: 'Mesa 2', personas: 6, hora: '14:00', fecha: '2026-05-13', estado: 'confirmada', notas: 'Alergia al gluten' },
  { id: 4, nombre: 'Roberto Silva',   telefono: '+56955443322', mesa: 'Mesa 1', personas: 3, hora: '15:30', fecha: '2026-05-13', estado: 'cancelada',  notas: '' },
  { id: 5, nombre: 'Valentina Cruz',  telefono: '+56933221100', mesa: 'Mesa 5', personas: 5, hora: '19:00', fecha: '2026-05-13', estado: 'confirmada', notas: 'Aniversario, vino cortesía' },
  { id: 6, nombre: 'Diego Fuentes',   telefono: '+56944556677', mesa: 'Mesa 3', personas: 2, hora: '20:00', fecha: '2026-05-13', estado: 'pendiente',  notas: '' },
  { id: 7, nombre: 'Sofía Mendoza',   telefono: '+56922334455', mesa: 'Mesa 6', personas: 8, hora: '21:00', fecha: '2026-05-13', estado: 'confirmada', notas: 'Reunión de empresa' },
];

const MESAS = [
  { id: 1, nombre: 'Mesa 1', capacidad: 4 },
  { id: 2, nombre: 'Mesa 2', capacidad: 6 },
  { id: 3, nombre: 'Mesa 3', capacidad: 2 },
  { id: 4, nombre: 'Mesa 4', capacidad: 4 },
  { id: 5, nombre: 'Mesa 5', capacidad: 6 },
  { id: 6, nombre: 'Mesa 6', capacidad: 8 },
  { id: 7, nombre: 'Mesa 7', capacidad: 2 },
  { id: 8, nombre: 'Mesa 8', capacidad: 4 },
  { id: 9, nombre: 'Mesa 9', capacidad: 4 },
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 12);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pad2(n) { return String(n).padStart(2, '0'); }
function dateStr(y, m, d) { return `${y}-${pad2(m + 1)}-${pad2(d)}`; }
function timeToFraction(hora) { const [h, m] = hora.split(':').map(Number); return (h - 12) + m / 60; }
function getDaysInMonthGrid(year, month) {
  const first = new Date(year, month, 1).getDay();
  const days  = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return cells;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusPill({ estado }) {
  const s = STATUS[estado] ?? STATUS.pendiente;
  return (
    <span style={{ fontSize: 11, fontWeight: 500, borderRadius: 4, padding: '2px 8px', background: `${s.color}18`, border: `1px solid ${s.borderAlpha}`, color: s.color, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

// Animated progress bar for occupancy
function OccupancyBar({ value }) {
  return (
    <div style={{ height: 4, background: '#1E1E22', borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        style={{
          height: '100%', borderRadius: 2,
          background: value > 80 ? T.red : value > 50 ? T.orange : T.green,
        }}
      />
    </div>
  );
}

// Pulsing status dot
function PulseDot({ color }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
      <span className="animate-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, opacity: 0.4 }} />
      <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ReservasPage({
  getDaysInMonth: _getDaysInMonth,
  reservas: reservasReal,
  selectedDate: selectedDateProp, setSelectedDate: setSelectedDateProp,
  reservasPeriodo, setReservasPeriodo,
  autoReminder, setAutoReminder,
  autoWhatsApp, setAutoWhatsApp,
  dailyReservations: dailyReal,
  reservaPedidoMap,
  loadProductos, openPedidoDetalle,
  crearPedidoRes, setCrearPedidoRes,
  setSelectedReservaConsumo, setReservaConsumoModal, loadReservaConsumos,
  updateReservaEstado,
  sendWhatsApp,
  deleteReserva,
  crearPedidoLoading,
  handleCrearPedidoDesdeReserva,
  setIsNewResModalOpen,
}) {
  const today = new Date();
  const [calYear, setCalYear]         = useState(today.getFullYear());
  const [calMonth, setCalMonth]       = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [filterEstado, setFilterEstado] = useState('all');
  const [view, setView]               = useState('mapa');
  const [selectedRes, setSelectedRes] = useState(null);
  const [hoveredMesa, setHoveredMesa] = useState(null);

  const selDateStr = dateStr(calYear, calMonth, selectedDay);
  const allReservas = (reservasReal && reservasReal.length > 0) ? reservasReal : MOCK_RESERVAS;
  const dayReservas = allReservas.filter(r => r.fecha === selDateStr);
  const filtered = filterEstado === 'all' ? dayReservas : dayReservas.filter(r => r.estado === filterEstado);

  const stats = useMemo(() => {
    const activas    = dayReservas.filter(r => r.estado !== 'cancelada');
    const totalP     = activas.reduce((s, r) => s + (r.personas || 0), 0);
    const ocupacion  = Math.round((activas.length / MESAS.length) * 100);
    const nowStr     = `${pad2(today.getHours())}:${pad2(today.getMinutes())}`;
    const proxima    = activas.find(r => r.hora > nowStr);
    return { total: activas.length, totalPersonas: totalP, ocupacion, proxima };
  }, [dayReservas]);

  const dotsMap = useMemo(() => {
    const m = {};
    allReservas.forEach(r => {
      const d  = parseInt(r.fecha.split('-')[2]);
      const mo = parseInt(r.fecha.split('-')[1]) - 1;
      const yr = parseInt(r.fecha.split('-')[0]);
      if (yr === calYear && mo === calMonth) m[d] = true;
    });
    return m;
  }, [allReservas, calYear, calMonth]);

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  const cells     = getDaysInMonthGrid(calYear, calMonth);
  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // Mesa state helpers
  function getMesaState(mesa) {
    const r = dayReservas.find(res => res.mesa === mesa.nombre && res.estado !== 'cancelada');
    if (!r) return { estado: 'disponible', reserva: null };
    return { estado: r.estado, reserva: r };
  }

  function getMesaStyle(estado) {
    const TR = 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease';
    switch (estado) {
      case 'confirmada': return {
        bg: T.greenDim, border: T.greenBorder,
        shadow: '0 0 0 1px #16A34A22, 0 0 12px #16A34A18',
        labelColor: T.green, capacityColor: T.greenCapacity,
        dotColor: '#4ADE80', opacity: 1, transition: TR,
      };
      case 'pendiente': return {
        bg: T.orangeDim, border: T.orangeBorder,
        shadow: '0 0 0 1px #D9770622, 0 0 12px #D9770618',
        labelColor: T.orange, capacityColor: T.orangeCapacity,
        dotColor: '#FBBF24', opacity: 1, transition: TR,
      };
      case 'cancelada': return {
        bg: T.redDim, border: T.redBorder,
        shadow: 'none',
        labelColor: T.red, capacityColor: T.redCapacity,
        dotColor: T.redBorder, opacity: 0.65, transition: TR,
      };
      case 'asistió': return {
        bg: T.blueDim, border: T.blueBorder,
        shadow: '0 0 0 1px #2563EB22, 0 0 12px #2563EB18',
        labelColor: T.blue, capacityColor: T.blueCapacity,
        dotColor: T.blueBorder, opacity: 1, transition: TR,
      };
      default: return {
        bg: '#111113', border: '#27272A',
        shadow: 'none',
        labelColor: '#A1A1AA', capacityColor: T.textDim,
        dotColor: 'transparent', opacity: 1, transition: TR,
      };
    }
  }

  // Stagger variants for mesa grid
  const gridVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
  };
  const cardVariants = {
    hidden:  { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  const FILTER_OPTIONS = [
    { key: 'all',        label: 'Todas',       color: '#F4F4F5', border: '#3F3F46', borderLeft: null,      badgeBg: '#18181B',  badgeColor: '#A1A1AA' },
    { key: 'confirmada', label: 'Confirmadas',  color: T.green,  border: T.greenBorder, borderLeft: T.greenBorder, badgeBg: T.greenDim,  badgeColor: T.green  },
    { key: 'pendiente',  label: 'Pendientes',   color: T.orange, border: T.orangeBorder, borderLeft: T.orangeBorder, badgeBg: T.orangeDim, badgeColor: T.orange },
    { key: 'cancelada',  label: 'Canceladas',   color: T.red,    border: T.redBorder, borderLeft: T.redBorder, badgeBg: T.redDim,   badgeColor: T.red   },
  ];

  const LEGEND_ITEMS = [
    { estado: 'disponible', label: 'Disponible', color: '#3F3F46' },
    { estado: 'confirmada', label: 'Confirmada', color: '#16A34A' },
    { estado: 'pendiente',  label: 'Pendiente',  color: '#D97706' },
    { estado: 'cancelada',  label: 'Cancelada',  color: '#DC2626' },
    { estado: 'asistió',    label: 'Asistió',    color: '#2563EB' },
  ];

  return (
    <motion.div
      key="reservas"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: T.bg, minHeight: '100vh', fontFamily: "'Inter', 'Geist', system-ui, sans-serif" }}
      className="flex flex-col h-full"
    >
      {/* ── Header ── */}
      <div style={{ borderBottom: `1px solid ${T.purpleBdr}`, padding: '16px 24px', background: 'linear-gradient(to right, rgba(124,58,237,.04), transparent)' }}
        className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.purple, background: T.purpleDim, border: `1px solid ${T.purpleBdr}`, borderRadius: 4, padding: '2px 8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Reservas
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', margin: 0 }}>Gestión de <span style={{ color: T.purple }}>Mesas</span></h1>
            {/* Header badges */}
            <span style={{ fontSize: 11, fontWeight: 500, color: T.purple, background: T.purpleDim, border: `1px solid ${T.purpleBdr}`, borderRadius: 4, padding: '2px 8px' }}>
              {dayReservas.filter(r => r.estado !== 'cancelada').length} activas hoy
            </span>
            <span style={{ fontSize: 11, color: T.textDim, background: '#161618', border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 8px' }}>
              12:00 – 24:00
            </span>
            <span style={{
              fontSize: 11, fontWeight: 500, borderRadius: 4, padding: '2px 8px',
              color: stats.ocupacion > 80 ? T.red : stats.ocupacion > 50 ? T.orange : T.green,
              background: stats.ocupacion > 80 ? T.redDim : stats.ocupacion > 50 ? T.orangeDim : T.greenDim,
              border: `1px solid ${stats.ocupacion > 80 ? T.redBdr : stats.ocupacion > 50 ? T.orangeBdr : T.greenBdr}`,
            }}>
              Ocupación {stats.ocupacion}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '4px', display: 'flex', gap: '4px' }}>
            {[
              { key: 'mapa',     label: 'Mapa',       icon: <LayoutGrid size={13} /> },
              { key: 'timeline', label: 'Línea tiempo', icon: <List size={13} /> },
            ].map(({ key, label, icon }) => (
              <button key={key} onClick={() => setView(key)}
                style={{
                  background: view === key ? 'rgba(124,58,237,0.2)' : 'transparent',
                  color: view === key ? '#C4B5FD' : '#9CA3AF',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  padding: '6px 14px', fontSize: '13px', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'all 150ms',
                }}>
                {icon}{label}
              </button>
            ))}
          </div>

          {setIsNewResModalOpen && (
            <button
              onClick={() => setIsNewResModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                height: 44, padding: '0 24px', borderRadius: 12,
                background: T.purple, border: 'none', color: '#fff',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                transition: 'background 150ms, transform 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#6D28D9'; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.purple; }}
            >
              <Plus size={17} /> Nueva reserva
            </button>
          )}
        </div>
      </div>

      {/* ── Body 3-panel ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 73px)' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ width: '25%', minWidth: 240, maxWidth: 300, borderRight: `1px solid ${T.borderDim}`, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Mini calendar */}
          <div style={{ background: 'rgba(124,58,237,.03)', border: `1px solid rgba(124,58,237,.22)`, borderRadius: 8, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <button onClick={prevMonth}
                style={{ background: '#1E1E22', border: `1px solid ${T.border}`, borderRadius: 4, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textDim, transition: 'all 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.color = T.purple; e.currentTarget.style.borderColor = T.purple; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.textDim; e.currentTarget.style.borderColor = T.border; }}>
                <ChevronLeft size={13} />
              </button>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#C4B5FD', textTransform: 'capitalize' }}>{monthLabel}</span>
              <button onClick={nextMonth}
                style={{ background: '#1E1E22', border: `1px solid ${T.border}`, borderRadius: 4, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textDim, transition: 'all 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.color = T.purple; e.currentTarget.style.borderColor = T.purple; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.textDim; e.currentTarget.style.borderColor = T.border; }}>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Day-of-week header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
              {['L','M','X','J','V','S','D'].map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'rgba(124,58,237,.5)', paddingBottom: 4 }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {cells.map((d, i) => {
                const isToday = d && d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                const isSel   = d && d === selectedDay;
                const hasDot  = d && dotsMap[d];
                return (
                  <div key={i} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {d ? (
                      <button onClick={() => setSelectedDay(d)}
                        style={{
                          width: '100%', height: '100%', border: 'none', cursor: 'pointer',
                          borderRadius: isSel ? 8 : 4,
                          background: isSel ? '#7C3AED' : isToday ? 'rgba(124,58,237,0.15)' : 'transparent',
                          color: isSel ? '#fff' : isToday ? '#7C3AED' : '#AEAEB8',
                          fontSize: 13, fontWeight: isSel ? 600 : 500,
                          boxShadow: isSel ? '0 0 0 2px #7C3AED44' : 'none',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                          transition: 'background 0.15s, color 0.15s, box-shadow 0.15s, border-radius 0.15s',
                        }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#27272A'; }}
                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isToday ? 'rgba(124,58,237,0.15)' : 'transparent'; }}>
                        {d}
                        {/* Dot for days with reservations */}
                        {hasDot && (
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,0.7)' : '#7C3AED', display: 'block' }} />
                        )}
                      </button>
                    ) : <div />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filtros de estado */}
          <div style={{ background: T.card, border: `1px solid rgba(124,58,237,.18)`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(124,58,237,.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Filtrar por estado</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {FILTER_OPTIONS.map(({ key, label, color, border, borderLeft, badgeBg, badgeColor }) => {
                const count  = key === 'all' ? dayReservas.length : dayReservas.filter(r => r.estado === key).length;
                const active = filterEstado === key;
                return (
                  <motion.button key={key}
                    onClick={() => setFilterEstado(key)}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: active ? (key === 'all' ? '#18181B' : `${color}12`) : 'transparent',
                      border: `1px solid ${active ? border : 'transparent'}`,
                      borderLeft: active && borderLeft ? `3px solid ${borderLeft}` : active ? `1px solid ${border}` : '1px solid transparent',
                      borderRadius: 6, padding: active && borderLeft ? '10px 12px 10px 10px' : '10px 12px',
                      cursor: 'pointer', transition: 'background 120ms, border-color 120ms', width: '100%',
                    }}>
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: active ? color : '#A1A1AA' }}>{label}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 600, borderRadius: 4, padding: '2px 7px',
                      color: active ? badgeColor : '#888',
                      background: active ? badgeBg : '#1E1E22',
                      border: `1px solid ${active ? `${badgeColor}30` : T.border}`,
                    }}>
                      {count}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Ocupación hoy — stat-card con barra animada */}
          <div style={{
            background: stats.ocupacion > 80 ? 'rgba(248,113,113,.04)' : stats.ocupacion > 50 ? 'rgba(252,211,77,.04)' : 'rgba(74,222,128,.04)',
            border: `1px solid ${stats.ocupacion > 80 ? 'rgba(248,113,113,.25)' : stats.ocupacion > 50 ? 'rgba(252,211,77,.22)' : 'rgba(74,222,128,.22)'}`,
            borderRadius: 8, padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: stats.ocupacion > 80 ? 'rgba(248,113,113,.7)' : stats.ocupacion > 50 ? 'rgba(252,211,77,.7)' : 'rgba(74,222,128,.7)',
              }}>Ocupación hoy</span>
              <span style={{
                fontSize: 15, fontWeight: 700,
                color: stats.ocupacion > 80 ? T.red : stats.ocupacion > 50 ? T.orange : T.green,
              }}>
                {stats.ocupacion}%
              </span>
            </div>
            <OccupancyBar value={stats.ocupacion} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 11, color: '#5A5A62' }}>{stats.total} mesas activas</span>
              <span style={{ fontSize: 11, color: '#5A5A62' }}>{MESAS.length} total</span>
            </div>
          </div>

          {/* Stats rápidas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ background: 'rgba(74,222,128,.04)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 6, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(74,222,128,.6)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Comensales</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.green }}>{stats.totalPersonas}</span>
            </div>
            <div style={{ background: T.purpleDim, border: `1px solid ${T.purpleBdr}`, borderRadius: 6, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(124,58,237,.7)', textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>Próxima</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: T.purple, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {stats.proxima ? `${stats.proxima.hora} — ${stats.proxima.nombre}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ── CENTER PANEL ── */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Date bar */}
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.borderDim}`, borderLeft: `3px solid rgba(124,58,237,.5)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(124,58,237,.03)', zIndex: 10, backdropFilter: 'blur(8px)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#D4D4DC', textTransform: 'capitalize' }}>
              {new Date(selDateStr + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <span style={{ fontSize: 11, color: '#5A5A62', background: 'rgba(124,58,237,.08)', border: '1px solid rgba(124,58,237,.15)', borderRadius: 4, padding: '2px 8px' }}>{filtered.length} reservas</span>
          </div>

          {view === 'mapa' ? (
            /* ── Mesa map ── */
            <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>
              <motion.div
                variants={gridVariants}
                initial="hidden"
                animate="visible"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}
              >
                {MESAS.map(mesa => {
                  const { estado, reserva } = getMesaState(mesa);
                  const ms = getMesaStyle(estado);
                  const isOcupada = estado !== 'disponible';
                  const isPending = estado === 'cancelada';
                  const isHovered = hoveredMesa === mesa.id;

                  return (
                    <motion.div
                      key={mesa.id}
                      variants={cardVariants}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onMouseEnter={e => {
                        setHoveredMesa(mesa.id);
                        if (estado === 'disponible') {
                          e.currentTarget.style.borderColor = 'rgba(124,58,237,.4)';
                          e.currentTarget.style.background = 'rgba(124,58,237,.06)';
                          e.currentTarget.style.boxShadow = '0 0 0 1px rgba(124,58,237,.15), 0 0 16px rgba(124,58,237,.08)';
                        }
                      }}
                      onMouseLeave={e => {
                        setHoveredMesa(null);
                        if (estado === 'disponible') {
                          e.currentTarget.style.borderColor = '#27272A';
                          e.currentTarget.style.background = '#111113';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                      onClick={() => reserva && setSelectedRes(reserva.id === selectedRes?.id ? null : reserva)}
                      style={{
                        position: 'relative',
                        background: ms.bg,
                        border: `1px solid ${ms.border}`,
                        borderRadius: 10,
                        padding: '20px 18px',
                        cursor: reserva ? 'pointer' : 'default',
                        opacity: ms.opacity,
                        minHeight: 112,
                        boxShadow: selectedRes?.id === reserva?.id ? `0 0 0 2px ${ms.border}` : ms.shadow,
                        transition: ms.transition,
                      }}>

                      {/* Pulsing dot for active reservations */}
                      {isOcupada && !isPending && (
                        <span style={{ position: 'absolute', top: 12, right: 12 }}>
                          <PulseDot color={ms.dotColor} />
                        </span>
                      )}

                      <div style={{ fontSize: 16, fontWeight: 600, color: ms.labelColor, marginBottom: 6 }}>{mesa.nombre}</div>
                      <div style={{ fontSize: 12, color: ms.capacityColor }}>{mesa.capacidad} pers. máx.</div>

                      {reserva && (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 12.5, color: ms.labelColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500, opacity: 0.9 }}>
                            {reserva.nombre}
                          </div>
                          <div style={{ fontSize: 11, color: ms.capacityColor, marginTop: 3, opacity: 0.7 }}>{reserva.hora} · {reserva.personas}p</div>
                        </div>
                      )}

                      {/* Tooltip */}
                      <AnimatePresence>
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.12 }}
                            style={{
                              position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                              transform: 'translateX(-50%)',
                              background: '#1E1E22', border: `1px solid ${T.border}`, borderRadius: 6,
                              padding: '8px 12px', zIndex: 50, whiteSpace: 'nowrap',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                              pointerEvents: 'none',
                            }}>
                            {reserva ? (
                              <>
                                <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{reserva.nombre}</div>
                                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>
                                  {reserva.hora} · {reserva.personas} personas
                                </div>
                                <StatusPill estado={reserva.estado} />
                              </>
                            ) : (
                              <div style={{ fontSize: 11, color: T.textDim }}>Mesa disponible · Click para asignar</div>
                            )}
                            {/* Tooltip arrow */}
                            <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, background: '#1E1E22', border: `1px solid ${T.border}`, borderTop: 'none', borderLeft: 'none', rotate: '45deg' }} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Legend */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                style={{ display: 'flex', gap: 16, flexWrap: 'wrap', paddingTop: 4, borderTop: `1px solid ${T.borderDim}` }}>
                {LEGEND_ITEMS.map(({ estado, label, color }) => (
                  <div key={estado} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#71717A' }}>{label}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          ) : (
            /* ── Timeline / Gantt ── */
            <div style={{ padding: 20, flex: 1 }}>
              {/* Hour ruler */}
              <div style={{ display: 'flex', marginBottom: 8, paddingLeft: 80 }}>
                {HOURS.map(h => (
                  <div key={h} style={{ flex: 1, fontSize: 10, color: '#3A3A40', textAlign: 'left', borderLeft: `1px solid ${T.borderDim}`, paddingLeft: 4, paddingBottom: 4 }}>
                    {h}:00
                  </div>
                ))}
              </div>

              {/* Mesa rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {MESAS.map(mesa => {
                  const mesaRes = filtered.filter(r => r.mesa === mesa.nombre);
                  return (
                    <div key={mesa.id} style={{ display: 'flex', alignItems: 'center', minHeight: 40 }}>
                      <div style={{ width: 80, flexShrink: 0, fontSize: 11, color: T.textDim, paddingRight: 12, textAlign: 'right' }}>{mesa.nombre}</div>
                      <div style={{ flex: 1, position: 'relative', height: 36, background: '#111113', borderRadius: 4, overflow: 'visible' }}>
                        {HOURS.map((_, i) => (
                          <div key={i} style={{ position: 'absolute', left: `${(i / HOURS.length) * 100}%`, top: 0, bottom: 0, borderLeft: `1px solid ${T.borderDim}` }} />
                        ))}
                        {mesaRes.map(res => {
                          const s = STATUS[res.estado] ?? STATUS.pendiente;
                          const startFrac = timeToFraction(res.hora) / HOURS.length;
                          const durFrac   = 1.5 / HOURS.length;
                          return (
                            <motion.div key={res.id}
                              initial={{ opacity: 0, scaleX: 0.8 }}
                              animate={{ opacity: 1, scaleX: 1 }}
                              style={{
                                position: 'absolute', left: `${startFrac * 100}%`, width: `${durFrac * 100}%`,
                                top: 3, bottom: 3, background: `${s.color}18`, border: `1px solid ${s.borderAlpha}`,
                                borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center',
                                padding: '0 8px', gap: 5, overflow: 'hidden', whiteSpace: 'nowrap',
                                boxShadow: selectedRes?.id === res.id ? `0 0 0 1px ${s.color}` : 'none',
                                zIndex: selectedRes?.id === res.id ? 5 : 1, transition: 'box-shadow 150ms',
                              }}
                              onClick={() => setSelectedRes(res.id === selectedRes?.id ? null : res)}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                              <span style={{ fontSize: 11, color: s.color, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.nombre}</span>
                              <span style={{ fontSize: 10, color: '#555', flexShrink: 0 }}>· {res.personas}p</span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#333', gap: 10 }}>
                  <Calendar size={32} style={{ opacity: 0.4 }} />
                  <span style={{ fontSize: 13 }}>Sin reservas para este período</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ width: '25%', minWidth: 240, maxWidth: 300, borderLeft: `1px solid ${T.borderDim}`, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">
            {selectedRes ? (
              /* Detail panel */
              <motion.div key={`detail-${selectedRes.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.purple, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, opacity: 0.7 }}>Detalle de reserva</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>{selectedRes.nombre}</div>
                  </div>
                  <button onClick={() => setSelectedRes(null)}
                    style={{ background: '#1E1E22', border: `1px solid ${T.border}`, borderRadius: 4, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textDim, flexShrink: 0, transition: 'all 120ms' }}
                    onMouseEnter={e => { e.currentTarget.style.color = T.text; }}
                    onMouseLeave={e => { e.currentTarget.style.color = T.textDim; }}>
                    <X size={12} />
                  </button>
                </div>

                <StatusPill estado={selectedRes.estado} />

                {/* Info rows */}
                <div style={{ background: 'rgba(124,58,237,.03)', border: `1px solid rgba(124,58,237,.2)`, borderRadius: 8, overflow: 'hidden' }}>
                  {[
                    { icon: <Clock size={13} />,   label: 'Hora',     value: selectedRes.hora },
                    { icon: <Users size={13} />,   label: 'Personas', value: `${selectedRes.personas} personas` },
                    { icon: <Utensils size={13} />,label: 'Mesa',     value: selectedRes.mesa || '—' },
                    { icon: <Phone size={13} />,   label: 'Teléfono', value: selectedRes.telefono || '—' },
                  ].map(({ icon, label, value }, i, arr) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i < arr.length - 1 ? `1px solid rgba(124,58,237,.1)` : 'none' }}>
                      <span style={{ color: 'rgba(124,58,237,.6)', flexShrink: 0 }}>{icon}</span>
                      <span style={{ fontSize: 11, color: T.textDim, width: 60, flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: 12, color: '#C8C8D0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>

                {selectedRes.notas && (
                  <div style={{ background: T.purpleDim, border: `1px solid ${T.purpleBdr}`, borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: T.purple, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Notas</div>
                    <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>{selectedRes.notas}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedRes.estado === 'pendiente' && (
                    <button onClick={() => updateReservaEstado?.(selectedRes.id, 'confirmada')}
                      style={{ background: `${T.green}18`, border: `1px solid ${T.greenBdr}`, color: T.green, borderRadius: 6, padding: '9px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', transition: 'opacity 120ms', minHeight: 44 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                      <Check size={13} /> Confirmar reserva
                    </button>
                  )}
                  {selectedRes.estado === 'confirmada' && (
                    <button onClick={() => updateReservaEstado?.(selectedRes.id, 'asistió')}
                      style={{ background: T.purpleDim, border: `1px solid ${T.purpleBdr}`, color: T.purple, borderRadius: 6, padding: '9px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', transition: 'opacity 120ms', minHeight: 44 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                      <UserCheck size={13} /> Marcar asistencia
                    </button>
                  )}
                  <button style={{ background: T.card, border: `1px solid ${T.border}`, color: T.textMuted, borderRadius: 6, padding: '9px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', transition: 'all 120ms', minHeight: 44 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3A3A40'; e.currentTarget.style.color = '#CCC'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}>
                    <RefreshCw size={12} /> Reasignar mesa
                  </button>
                  {selectedRes.estado !== 'cancelada' && !reservaPedidoMap?.[selectedRes.id] && (
                    <button onClick={() => setCrearPedidoRes?.(selectedRes)}
                      style={{ background: T.card, border: `1px solid ${T.border}`, color: T.textMuted, borderRadius: 6, padding: '9px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', transition: 'all 120ms', minHeight: 44 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#3A3A40'; e.currentTarget.style.color = '#CCC'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}>
                      <ShoppingBag size={12} /> Crear pedido
                    </button>
                  )}
                  {selectedRes.telefono && (
                    <button onClick={() => sendWhatsApp?.(selectedRes.telefono, selectedRes.nombre, selectedRes.fecha, selectedRes.hora)}
                      style={{ background: `rgba(37,211,102,0.08)`, border: `1px solid rgba(37,211,102,0.2)`, color: T.whatsapp, borderRadius: 6, padding: '9px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', transition: 'opacity 120ms', minHeight: 44 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                      <MessageCircle size={12} /> Enviar WhatsApp
                    </button>
                  )}
                </div>

                {/* Danger zone */}
                {selectedRes.estado !== 'cancelada' && (
                  <div style={{ borderTop: `1px solid ${T.borderDim}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button onClick={() => updateReservaEstado?.(selectedRes.id, 'cancelada')}
                      style={{ background: 'transparent', border: `1px solid rgba(231,76,60,0.2)`, color: T.red, borderRadius: 6, padding: '8px 14px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', transition: 'all 120ms', opacity: 0.7, minHeight: 44 }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = `${T.red}10`; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.background = 'transparent'; }}>
                      <X size={12} /> Cancelar reserva
                    </button>
                    <button onClick={() => deleteReserva?.(selectedRes)}
                      style={{ background: 'transparent', border: `1px solid ${T.borderDim}`, color: T.textDim, borderRadius: 6, padding: '8px 14px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', transition: 'all 120ms', opacity: 0.6, minHeight: 44 }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderColor = `rgba(231,76,60,0.25)`; e.currentTarget.style.color = T.red; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.borderColor = T.borderDim; e.currentTarget.style.color = T.textDim; }}>
                      <Trash2 size={12} /> Eliminar reserva
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* Elegant empty state */
              <motion.div key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, textAlign: 'center', position: 'relative' }}>

                <DotPattern color="#7C3AED" size={20} opacity={0.15} style={{ zIndex: 0 }} />

                {/* Floating calendar icon */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ color: 'rgba(124,58,237,.35)', position: 'relative', zIndex: 1 }}>
                  <Calendar size={36} />
                </motion.div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p style={{ fontSize: 13, color: '#5A5A70', margin: '0 0 4px', fontWeight: 500 }}>
                    Selecciona una mesa para ver el detalle
                  </p>
                  <p style={{ fontSize: 11, color: '#3E3E50', margin: 0 }}>
                    o crea una nueva reserva
                  </p>
                </div>

                {setIsNewResModalOpen && (
                  <button onClick={() => setIsNewResModalOpen(true)}
                    style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.textDim, borderRadius: 6, padding: '7px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, transition: 'all 150ms', minHeight: 44, position: 'relative', zIndex: 1 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.purple; e.currentTarget.style.color = T.purple; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textDim; }}>
                    <Plus size={13} /> Nueva reserva
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Modal crear pedido desde reserva ── */}
      <AnimatePresence>
        {crearPedidoRes && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
              onClick={() => !crearPedidoLoading && setCrearPedidoRes(null)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: 'relative', width: '100%', maxWidth: 360, background: '#0F0F13', border: `1px solid ${T.purpleBdr}`, borderRadius: 10, boxShadow: '0 32px 64px rgba(0,0,0,0.6)' }}>

              <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid rgba(124,111,224,0.1)` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${T.purple}, #5A4FC8)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingBag size={16} style={{ color: '#fff' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>Abrir pedido</div>
                      <div style={{ fontSize: 11, color: T.purple, marginTop: 1 }}>desde reserva</div>
                    </div>
                  </div>
                  <button onClick={() => setCrearPedidoRes(null)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.textDim, padding: 4 }}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Cliente',  value: crearPedidoRes.nombre },
                  { label: 'Mesa',     value: crearPedidoRes.mesa || '—' },
                  { label: 'Personas', value: `${crearPedidoRes.personas}` },
                  { label: 'Horario',  value: `${crearPedidoRes.fecha} · ${crearPedidoRes.hora}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${T.borderDim}` }}>
                    <span style={{ fontSize: 12, color: T.textDim }}>{label}</span>
                    <span style={{ fontSize: 12, color: '#AAAAAC' }}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{ margin: '0 20px 16px', background: 'rgba(243,156,18,0.07)', border: '1px solid rgba(243,156,18,0.15)', borderRadius: 6, padding: '9px 12px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertCircle size={12} style={{ color: T.orange, marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'rgba(243,156,18,0.85)', lineHeight: 1.5 }}>El pedido se crea vacío. Agrega productos desde <strong>Pedidos</strong>.</span>
              </div>

              <div style={{ padding: '0 20px 20px', display: 'flex', gap: 8 }}>
                <button disabled={crearPedidoLoading} onClick={() => setCrearPedidoRes(null)}
                  style={{ flex: 1, padding: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#666', fontSize: 13, cursor: 'pointer', minHeight: 44 }}>
                  Cancelar
                </button>
                <button disabled={crearPedidoLoading} onClick={() => handleCrearPedidoDesdeReserva?.(crearPedidoRes)}
                  style={{ flex: 1, padding: '9px', background: crearPedidoLoading ? `${T.purple}80` : T.purple, border: 'none', borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 500, cursor: crearPedidoLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'opacity 120ms', minHeight: 44 }}
                  onMouseEnter={e => { if (!crearPedidoLoading) e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  {crearPedidoLoading
                    ? <><span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Creando...</>
                    : <><ShoppingBag size={13} /> Abrir pedido</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </motion.div>
  );
}
