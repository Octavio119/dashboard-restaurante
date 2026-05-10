import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity, DollarSign, TrendingUp, Receipt, ShoppingBag, Flame, BarChart2, Lock, Zap,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';

const PIE_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#14B8A6', '#0EA5E9'];

const NUM_STYLE = { fontVariantNumeric: 'tabular-nums' };

export default function AnalyticsPage({ loadAnalytics, analytics, analyticsError }) {
  const isPlanLocked = analyticsError?.message === 'plan_required';
  const pct = analytics?.comparacion_pct;

  const deltaColor  = pct == null ? '#64748B' : pct >= 0 ? '#10B981' : '#EF4444';
  const deltaBorder = pct == null ? 'rgba(100,116,139,.12)' : pct >= 0 ? 'rgba(16,185,129,.18)' : 'rgba(239,68,68,.18)';
  const deltaDivider = pct == null ? 'rgba(100,116,139,.12)' : pct >= 0 ? 'rgba(16,185,129,.18)' : 'rgba(239,68,68,.18)';

  if (isPlanLocked) {
    return (
      <motion.div
        key="analytics-locked"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="p-5 sm:p-8 flex flex-col gap-7 max-w-[1400px] w-full mx-auto"
      >
        <div className="flex items-center gap-3 mb-1">
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(59,130,246,.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,.2)' }}>
            <BarChart2 size={9} className="inline" /> Análisis
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
          Centro de <span style={{ color: '#3B82F6' }}>Analytics</span>
        </h2>

        <div className="card flex flex-col items-center justify-center gap-6 py-20 px-8 text-center"
          style={{ border: '1px solid rgba(139,92,246,.2)', background: 'linear-gradient(160deg, rgba(139,92,246,.06) 0%, rgba(18,18,30,1) 60%)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.2)' }}>
            <Lock size={28} style={{ color: '#8B5CF6' }} />
          </div>
          <div className="flex flex-col gap-2 max-w-sm">
            <p className="text-xl font-black" style={{ color: '#F0F0FF' }}>Analytics requiere plan Pro</p>
            <p className="text-sm" style={{ color: '#9090B0' }}>
              Desbloquea métricas de ventas por hora, ranking de productos, comparativas semana a semana y más.
            </p>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('nav:billing'))}
            className="btn-primary flex items-center gap-2">
            <Zap size={14} /> Actualizar a Pro
          </button>
          <p className="text-xs" style={{ color: '#50506A' }}>
            Plan Pro · $29/mes · Sin límite de órdenes
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="p-5 sm:p-8 flex flex-col gap-7 max-w-[1400px] w-full mx-auto"
    >

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(59,130,246,.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,.2)' }}>
              <BarChart2 size={9} className="inline" /> Análisis
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
            Centro de{' '}
            <span style={{ color: '#3B82F6' }}>Analytics</span>
          </h2>
          <p className="text-[#8892A4] text-sm mt-2">
            Datos históricos · comparativas por período
          </p>
        </div>
        <button onClick={loadAnalytics} className="btn-ghost flex items-center gap-2 text-xs w-fit">
          <Activity size={14} /> Actualizar datos
        </button>
      </div>

      {/* ── KPI Cards — flat, data-dense, tabular numbers ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Ventas hoy */}
        <div className="card p-5 flex flex-col gap-3" style={{ border: '1px solid rgba(59,130,246,.14)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>Ventas hoy</span>
            {pct != null && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${pct >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                <TrendingUp size={9} className={pct < 0 ? 'rotate-180' : ''} />
                {Math.abs(pct)}%
              </span>
            )}
          </div>
          <p className="text-[32px] font-black tracking-tight leading-none" style={{ color: '#F8FAFC', ...NUM_STYLE }}>
            ${(analytics?.total_hoy ?? 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
          </p>
          {analytics?.total_ayer != null && (
            <p className="text-xs" style={{ color: '#475569' }}>
              vs ayer{' '}
              <span style={{ color: '#94A3B8', ...NUM_STYLE }}>
                ${analytics.total_ayer.toLocaleString('es-CL')}
              </span>
            </p>
          )}
          <div className="h-px mt-auto" style={{ background: 'rgba(59,130,246,.15)' }} />
          <DollarSign size={13} style={{ color: '#3B82F6', opacity: 0.55 }} />
        </div>

        {/* Ticket promedio */}
        <div className="card p-5 flex flex-col gap-3" style={{ border: '1px solid rgba(99,102,241,.14)' }}>
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>Ticket promedio</span>
          <p className="text-[32px] font-black tracking-tight leading-none" style={{ color: '#F8FAFC', ...NUM_STYLE }}>
            ${(analytics?.ticket_promedio_hoy ?? 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
          </p>
          {analytics?.ticket_promedio_ayer != null && (
            <p className="text-xs" style={{ color: '#475569' }}>
              vs ayer{' '}
              <span style={{ color: '#94A3B8', ...NUM_STYLE }}>
                ${analytics.ticket_promedio_ayer.toLocaleString('es-CL')}
              </span>
            </p>
          )}
          <div className="h-px mt-auto" style={{ background: 'rgba(99,102,241,.15)' }} />
          <Receipt size={13} style={{ color: '#6366F1', opacity: 0.55 }} />
        </div>

        {/* Transacciones */}
        <div className="card p-5 flex flex-col gap-3" style={{ border: '1px solid rgba(20,184,166,.14)' }}>
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>Transacciones</span>
          <p className="text-[32px] font-black tracking-tight leading-none" style={{ color: '#F8FAFC', ...NUM_STYLE }}>
            {analytics?.cantidad_hoy ?? 0}
          </p>
          {analytics?.cantidad_ayer != null && (
            <p className="text-xs" style={{ color: '#475569' }}>
              vs ayer{' '}
              <span style={{ color: '#94A3B8', ...NUM_STYLE }}>
                {analytics.cantidad_ayer}
              </span>
            </p>
          )}
          <div className="h-px mt-auto" style={{ background: 'rgba(20,184,166,.15)' }} />
          <ShoppingBag size={13} style={{ color: '#14B8A6', opacity: 0.55 }} />
        </div>

        {/* Delta card — hoy vs ayer */}
        <div className="card p-5 flex flex-col gap-3" style={{ border: `1px solid ${deltaBorder}` }}>
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>Hoy vs ayer</span>
          <p className="text-[32px] font-black tracking-tight leading-none" style={{ color: deltaColor, ...NUM_STYLE }}>
            {pct == null ? '—' : `${pct > 0 ? '+' : ''}${pct}%`}
          </p>
          <p className="text-xs" style={{ color: '#475569' }}>en ventas totales</p>
          <div className="h-px mt-auto" style={{ background: deltaDivider }} />
          <TrendingUp size={13} style={{ color: deltaColor, opacity: 0.55, transform: pct != null && pct < 0 ? 'rotate(180deg)' : undefined }} />
        </div>

      </div>

      {/* ── Charts — 3 + 2 col split ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Bar chart — horas pico */}
        <div className="lg:col-span-3 card p-5 sm:p-6 flex flex-col gap-4"
          style={{ border: '1px solid rgba(59,130,246,.1)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>Distribución horaria</p>
              <h3 className="text-sm font-bold mt-0.5" style={{ color: '#F8FAFC' }}>Horas pico — hoy</h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded"
              style={{ background: 'rgba(59,130,246,.08)', color: '#3B82F6', border: '1px solid rgba(59,130,246,.15)' }}>
              24 h
            </span>
          </div>
          {analytics?.ventas_por_hora?.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.ventas_por_hora} barSize={16} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11 }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(59,130,246,.2)', borderRadius: '10px', color: '#F8FAFC', fontSize: '12px', padding: '8px 14px' }}
                    cursor={{ fill: 'rgba(59,130,246,.06)' }}
                    formatter={v => [v + ' pedidos', 'Ventas']}
                  />
                  <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                    {analytics.ventas_por_hora.map((e, i) => {
                      const max = Math.max(...analytics.ventas_por_hora.map(h => h.orders));
                      return <Cell key={i} fill={e.orders === max ? '#3B82F6' : 'rgba(59,130,246,0.18)'} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-sm" style={{ color: '#475569' }}>
              Sin ventas registradas hoy
            </div>
          )}
        </div>

        {/* Donut — top productos */}
        <div className="lg:col-span-2 card p-5 sm:p-6 flex flex-col gap-4"
          style={{ border: '1px solid rgba(99,102,241,.1)' }}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>Ranking</p>
            <h3 className="text-sm font-bold mt-0.5" style={{ color: '#F8FAFC' }}>Top productos — 30 días</h3>
          </div>

          {analytics?.top_productos?.length > 0 ? (
            <div className="flex flex-col gap-4 flex-1">
              <div className="h-[190px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.top_productos}
                      cx="50%" cy="50%"
                      innerRadius={54} outerRadius={82}
                      dataKey="sales"
                      paddingAngle={3}
                    >
                      {analytics.top_productos.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, _n, p) => [v + ' uds', p.payload.name]}
                      contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(99,102,241,.2)', borderRadius: '10px', color: '#F8FAFC', fontSize: '11px', padding: '8px 14px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                {analytics.top_productos.map((p, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="text-[11px] font-black w-4 text-right flex-shrink-0" style={{ color: '#475569', ...NUM_STYLE }}>
                      {i + 1}
                    </span>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs flex-grow truncate" style={{ color: '#CBD5E1' }}>{p.name}</span>
                    <span className="text-xs font-black flex-shrink-0" style={{ color: '#F8FAFC', ...NUM_STYLE }}>
                      {p.sales} uds
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
              <Flame size={22} style={{ color: '#8892A4', opacity: 0.25 }} />
              <p className="text-sm" style={{ color: '#475569' }}>Sin datos en 30 días</p>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
