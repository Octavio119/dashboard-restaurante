import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, DollarSign, TrendingUp, Receipt, ShoppingBag, Flame 
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';

const PIE_COLORS = ['#fbbf24','#f59e0b','#d97706','#b45309','#92400e'];

export default function AnalyticsPage({
  loadAnalytics, analytics
}) {
  return (
    <motion.div key="analytics" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="p-8 flex flex-col gap-8 max-w-[1400px] w-full mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Centro de <span className="text-amber-500">Analytics</span></h2>
          <p className="text-zinc-500 text-sm mt-1">Métricas y tendencias operativas</p>
        </div>
        <button onClick={loadAnalytics} className="btn-ghost flex items-center gap-2 text-xs">
          <Activity size={14}/> Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-lg bg-zinc-800 text-amber-500 border border-zinc-700"><DollarSign size={18}/></div>
            {analytics?.comparacion_pct != null && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${analytics.comparacion_pct >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                <TrendingUp size={11} className={analytics.comparacion_pct < 0 ? 'rotate-180' : ''}/>
                {Math.abs(analytics.comparacion_pct)}%
              </span>
            )}
          </div>
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Ventas hoy</p>
            <h3 className="text-2xl font-black text-white mt-0.5">
              ${(analytics?.total_hoy ?? 0).toLocaleString('es-CL', { minimumFractionDigits:0 })}
            </h3>
            {analytics?.total_ayer != null && (
              <p className="text-[11px] text-zinc-500 mt-0.5">Ayer: ${analytics.total_ayer.toLocaleString('es-CL')}</p>
            )}
          </div>
        </div>

        <div className="card p-5 flex flex-col gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-800 text-amber-500 border border-zinc-700 w-fit"><Receipt size={18}/></div>
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Ticket promedio hoy</p>
            <h3 className="text-2xl font-black text-white mt-0.5">
              ${(analytics?.ticket_promedio_hoy ?? 0).toLocaleString('es-CL', { minimumFractionDigits:0 })}
            </h3>
            {analytics?.ticket_promedio_ayer != null && (
              <p className="text-[11px] text-zinc-500 mt-0.5">Ayer: ${analytics.ticket_promedio_ayer.toLocaleString('es-CL')}</p>
            )}
          </div>
        </div>

        <div className="card p-5 flex flex-col gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-800 text-amber-500 border border-zinc-700 w-fit"><ShoppingBag size={18}/></div>
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Transacciones hoy</p>
            <h3 className="text-2xl font-black text-white mt-0.5">{analytics?.cantidad_hoy ?? 0}</h3>
            {analytics?.cantidad_ayer != null && (
              <p className="text-[11px] text-zinc-500 mt-0.5">Ayer: {analytics.cantidad_ayer}</p>
            )}
          </div>
        </div>

        <div className={`card p-5 flex flex-col gap-3 ${analytics?.comparacion_pct == null ? '' : analytics.comparacion_pct >= 0 ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
          <div className={`p-2.5 rounded-lg border w-fit ${analytics?.comparacion_pct == null ? 'bg-zinc-800 border-zinc-700 text-amber-500' : analytics.comparacion_pct >= 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {analytics?.comparacion_pct == null || analytics.comparacion_pct >= 0 ? <TrendingUp size={18}/> : <TrendingUp size={18} className="rotate-180"/>}
          </div>
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Hoy vs ayer</p>
            <h3 className={`text-2xl font-black mt-0.5 ${analytics?.comparacion_pct == null ? 'text-zinc-500' : analytics.comparacion_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {analytics?.comparacion_pct == null ? 'Sin datos' : `${analytics.comparacion_pct > 0 ? '+' : ''}${analytics.comparacion_pct}%`}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">en ventas totales</p>
          </div>
        </div>
      </div>

      {/* Horas pico + Top Productos */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold text-zinc-300 mb-4 flex items-center gap-2"><Activity size={16} className="text-amber-400"/>Horas Pico — Hoy</h3>
          {analytics?.ventas_por_hora?.length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.ventas_por_hora} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a"/>
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill:'#52525b', fontSize:11 }}/>
                  <YAxis axisLine={false} tickLine={false} tick={{ fill:'#52525b', fontSize:11 }} allowDecimals={false}/>
                  <Tooltip contentStyle={{ background:'#18181b', border:'1px solid #3f3f46', borderRadius:'10px', color:'#fff' }} formatter={v => [v + ' ventas']}/>
                  <Bar dataKey="orders" radius={[4,4,0,0]}>
                    {analytics.ventas_por_hora.map((e,i) => {
                      const max = Math.max(...analytics.ventas_por_hora.map(h=>h.orders));
                      return <Cell key={i} fill={e.orders === max ? '#fbbf24' : 'rgba(251,191,36,0.2)'}/>;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-zinc-600 text-sm">Sin ventas registradas hoy</div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-zinc-300 mb-4 flex items-center gap-2"><Flame size={16} className="text-amber-400"/>Top Productos — 30 días</h3>
          {analytics?.top_productos?.length > 0 ? (
            <div className="flex gap-6 items-center">
              <div className="w-36 h-36 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.top_productos} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="sales" paddingAngle={3}>
                      {analytics.top_productos.map((_,i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={(v,_n,p) => [v+' uds', p.payload.name]} contentStyle={{ background:'#18181b', border:'1px solid #3f3f46', borderRadius:'10px', color:'#fff', fontSize:'11px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2.5 flex-grow">
                {analytics.top_productos.map((p,i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600 w-3">{i+1}</span>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:PIE_COLORS[i % PIE_COLORS.length] }}/>
                    <span className="text-xs text-zinc-300 flex-grow truncate">{p.name}</span>
                    <span className="text-xs font-black">{p.sales} uds</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-zinc-600 text-sm">Sin datos de ventas en los últimos 30 días</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
