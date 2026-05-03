import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Download, Plus, DollarSign, ShoppingBag, Calendar, Activity, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from 'recharts';
import MetricCard from '../components/ui/MetricCard';
import StatusBadge from '../components/ui/StatusBadge';

export default function DashboardPage({
  user,
  todayReservations,
  exportCSV,
  setIsNewResModalOpen,
  ventasResumen,
  pedidos,
  salesData,
  setActiveTab,
}) {
  const ticketProm = pedidos.length
    ? `$${(pedidos.reduce((a, o) => a + o.total, 0) / pedidos.length).toFixed(0)}`
    : '$0';

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="p-5 sm:p-8 flex flex-col gap-7 max-w-[1400px] w-full mx-auto"
    >

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
            Hola,{' '}
            <span className="text-amber-500">
              {user?.nombre?.split(' ')[0] || 'Usuario'}
            </span>
          </h2>
          <p className="text-zinc-500 text-sm mt-2 flex items-center gap-1.5">
            <Clock size={13} className="text-zinc-600" />
            <span>{todayReservations.length} reservas hoy</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="btn-ghost flex items-center gap-2"
          >
            <Download size={14} />
            Exportar CSV
          </button>
          <button
            onClick={() => setIsNewResModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={14} />
            Nueva Reserva
          </button>
        </div>
      </div>

      {/* ── KPI Cards — 4 col desktop / 2 tablet / 1 mobile ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ventas del día"
          value={`$${ventasResumen?.total?.toLocaleString('es-CL', { minimumFractionDigits: 0 }) || '0'}`}
          trend={12.5}
          icon={DollarSign}
        />
        <MetricCard
          title="Pedidos totales"
          value={pedidos.length}
          trend={8.2}
          icon={ShoppingBag}
        />
        <MetricCard
          title="Reservas hoy"
          value={todayReservations.length}
          trend={-2.4}
          icon={Calendar}
        />
        <MetricCard
          title="Ticket promedio"
          value={ticketProm}
          trend={4.1}
          icon={Activity}
        />
      </div>

      {/* ── Charts row — 2/3 + 1/3 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Área chart */}
        <div className="lg:col-span-2 card card-hover p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Rendimiento</p>
              <h3 className="text-sm font-bold text-zinc-200 mt-0.5">Ventas — últimos 7 días</h3>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#fbbf24" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#52525b', fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#52525b', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                    padding: '8px 14px',
                  }}
                  cursor={{ stroke: '#3f3f46', strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  fill="url(#colorSales)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#fbbf24', stroke: '#18181b', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pedidos recientes */}
        <div className="card card-hover p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Actividad</p>
              <h3 className="text-sm font-bold text-zinc-200 mt-0.5">Pedidos recientes</h3>
            </div>
            <button
              onClick={() => setActiveTab('Pedidos')}
              className="flex items-center gap-1 text-amber-400 text-xs font-bold hover:text-amber-300 transition-colors duration-150"
            >
              Ver todos
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="flex flex-col divide-y divide-zinc-800/80">
            {pedidos.slice(0, 5).map((o, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-0.5 min-w-0 pr-3">
                  <p className="text-sm font-semibold text-white truncate leading-snug">
                    {o.cliente_nombre}
                  </p>
                  <p className="text-[11px] text-zinc-500 truncate">{o.item}</p>
                </div>
                <StatusBadge status={o.estado} />
              </div>
            ))}

            {pedidos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <ShoppingBag size={22} className="text-zinc-700" />
                <p className="text-zinc-600 text-xs text-center">Sin pedidos hoy</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
