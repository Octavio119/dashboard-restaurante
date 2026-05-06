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
    <motion.div key="analytics" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="p-4 sm:p-8 flex flex-col gap-6 sm:gap-8 max-w-[1400px] w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Centro de <span style={{ color: 'var(--primary)' }}>Analytics</span></h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Métricas y tendencias operativas</p>
        </div>
        <button onClick={loadAnalytics} className="btn-ghost flex items-center gap-2 text-xs w-fit">
          <Activity size={14}/> Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Ventas hoy */}
        <div className="dash-card metric-card flex flex-col gap-4 cursor-default"
          style={{ borderTop: '2px solid #8B5CF6', background: 'linear-gradient(135deg, #8B5CF60D 0%, var(--bg-card-2) 60%)' }}>
          <div className="flex justify-between items-start">
            <div className="metric-icon" style={{ background: 'var(--purple-dim)' }}>
              <DollarSign size={17} style={{ color: '#8B5CF6' }} />
            </div>
            {analytics?.comparacion_pct != null && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${analytics.comparacion_pct >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                <TrendingUp size={10} className={analytics.comparacion_pct < 0 ? 'rotate-180' : ''} />
                {Math.abs(analytics.comparacion_pct)}%
              </span>
            )}
          </div>
          <div>
            <p className="metric-label">Ventas hoy</p>
            <h3 className="metric-value">${(analytics?.total_hoy ?? 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}</h3>
            {analytics?.total_ayer != null && (
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>Ayer: ${analytics.total_ayer.toLocaleString('es-CL')}</p>
            )}
          </div>
        </div>

        {/* Ticket promedio hoy */}
        <div className="dash-card metric-card flex flex-col gap-4 cursor-default"
          style={{ borderTop: '2px solid #06B6D4', background: 'linear-gradient(135deg, #06B6D40D 0%, var(--bg-card-2) 60%)' }}>
          <div className="metric-icon" style={{ background: 'rgba(6,182,212,0.12)' }}>
            <Receipt size={17} style={{ color: '#06B6D4' }} />
          </div>
          <div>
            <p className="metric-label">Ticket promedio hoy</p>
            <h3 className="metric-value" style={{ color: '#06B6D4' }}>${(analytics?.ticket_promedio_hoy ?? 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}</h3>
            {analytics?.ticket_promedio_ayer != null && (
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>Ayer: ${analytics.ticket_promedio_ayer.toLocaleString('es-CL')}</p>
            )}
          </div>
        </div>

        {/* Transacciones hoy */}
        <div className="dash-card metric-card flex flex-col gap-4 cursor-default"
          style={{ borderTop: '2px solid #F59E0B', background: 'linear-gradient(135deg, #F59E0B0D 0%, var(--bg-card-2) 60%)' }}>
          <div className="metric-icon" style={{ background: 'var(--yellow-dim)' }}>
            <ShoppingBag size={17} style={{ color: '#F59E0B' }} />
          </div>
          <div>
            <p className="metric-label">Transacciones hoy</p>
            <h3 className="metric-value" style={{ color: '#F59E0B' }}>{analytics?.cantidad_hoy ?? 0}</h3>
            {analytics?.cantidad_ayer != null && (
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>Ayer: {analytics.cantidad_ayer}</p>
            )}
          </div>
        </div>

        {/* Hoy vs ayer */}
        {(() => {
          const pct = analytics?.comparacion_pct;
          const color = pct == null ? '#8B5CF6' : pct >= 0 ? '#10B981' : '#EF4444';
          const dimColor = pct == null ? 'var(--purple-dim)' : pct >= 0 ? 'var(--teal-dim)' : 'var(--red-dim)';
          return (
            <div className="dash-card metric-card flex flex-col gap-4 cursor-default"
              style={{ borderTop: `2px solid ${color}`, background: `linear-gradient(135deg, ${color}0D 0%, var(--bg-card-2) 60%)` }}>
              <div className="metric-icon" style={{ background: dimColor }}>
                <TrendingUp size={17} style={{ color, transform: pct != null && pct < 0 ? 'rotate(180deg)' : undefined }} />
              </div>
              <div>
                <p className="metric-label">Hoy vs ayer</p>
                <h3 className="metric-value" style={{ color }}>
                  {pct == null ? 'Sin datos' : `${pct > 0 ? '+' : ''}${pct}%`}
                </h3>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>en ventas totales</p>
              </div>
            </div>
          );
        })()}

      </div>

      {/* Horas pico + Top Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-1)', fontSize: '14px' }}><Activity size={16} style={{ color: 'var(--purple)' }}/>Horas Pico — Hoy</h3>
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
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-1)', fontSize: '14px' }}><Flame size={16} style={{ color: 'var(--purple)' }}/>Top Productos — 30 días</h3>
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
