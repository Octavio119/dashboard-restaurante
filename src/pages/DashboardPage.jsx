import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Download, Plus, DollarSign, ShoppingBag, Calendar, Activity } from 'lucide-react';
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
  setActiveTab
}) {
  return (
    <motion.div key="dashboard" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="p-8 flex flex-col gap-8 max-w-[1400px] w-full mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight">
            Hola, <span className="text-amber-500">{user?.nombre?.split(' ')[0] || 'Usuario'}</span>
          </h2>
          <p className="text-zinc-500 text-sm mt-1 flex items-center gap-2">
            <Clock size={14} />
            {todayReservations.length} reservas hoy
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="btn-ghost flex items-center gap-2">
            <Download size={15} /> Exportar CSV
          </button>
          <button onClick={() => setIsNewResModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Nueva Reserva
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard title="Ventas del día" value={`$${ventasResumen?.total?.toLocaleString('es-CL', { minimumFractionDigits:2 }) || '0'}`} trend={12.5} icon={DollarSign} />
        <MetricCard title="Pedidos totales" value={pedidos.length} trend={8.2} icon={ShoppingBag} />
        <MetricCard title="Reservas hoy" value={todayReservations.length} trend={-2.4} icon={Calendar} />
        <MetricCard title="Ticket promedio" value={pedidos.length ? `$${(pedidos.reduce((a,o)=>a+o.total,0)/pedidos.length).toFixed(0)}` : '$0'} trend={4.1} icon={Activity} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 card p-6">
          <h3 className="font-bold text-zinc-300 mb-6">Performance de Ventas — Semana</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill:'#52525b', fontSize:12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill:'#52525b', fontSize:12 }} />
                <Tooltip contentStyle={{ background:'#18181b', border:'1px solid #3f3f46', borderRadius:'10px', color:'#fff' }} />
                <Area type="monotone" dataKey="sales" stroke="#fbbf24" strokeWidth={2} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-zinc-300">Pedidos recientes</h3>
            <button onClick={() => setActiveTab('Pedidos')} className="text-amber-400 text-xs font-bold hover:underline">Ver todos</button>
          </div>
          <div className="flex flex-col gap-2">
            {pedidos.slice(0,5).map((o,i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-white">{o.cliente_nombre}</p>
                  <p className="text-[11px] text-zinc-500">{o.item}</p>
                </div>
                <StatusBadge status={o.estado} />
              </div>
            ))}
            {pedidos.length === 0 && <p className="text-zinc-600 text-sm text-center py-4">Sin pedidos hoy</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
