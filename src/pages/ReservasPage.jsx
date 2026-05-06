import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Zap, Clock, Users, Utensils, ChefHat,
  ShoppingBag, Check, UserCheck, X, MessageCircle, Trash2, Calendar, AlertCircle
} from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';

export default function ReservasPage({
  getDaysInMonth,
  reservas,
  selectedDate, setSelectedDate,
  reservasPeriodo, setReservasPeriodo,
  autoReminder, setAutoReminder,
  autoWhatsApp, setAutoWhatsApp,
  dailyReservations,
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
  return (
    <motion.div key="reservas" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="p-4 sm:p-8 flex flex-col gap-6 max-w-[1400px] w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Módulo de <span style={{ color: 'var(--primary)' }}>Reservas</span></h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Calendario y gestión de disponibilidad</p>
        </div>
        {setIsNewResModalOpen && (
          <button
            onClick={() => setIsNewResModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)',
              color: 'white', border: 'none',
              padding: '9px 18px', fontSize: '13px', fontWeight: 600,
              borderRadius: '9px', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(139,92,246,.3)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> Nueva reserva
          </button>
        )}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
        {/* Calendario */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="card p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.12em]">
                {new Date(selectedDate+'T12:00:00').toLocaleDateString('es-ES', { month:'long', year:'numeric' }).toUpperCase()}
              </h3>
              <div className="flex gap-1">
                <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:border-[rgba(139,92,246,.4)] hover:text-[#8B5CF6]" style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                  <ChevronRight className="rotate-180" size={13}/>
                </button>
                <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:border-[rgba(139,92,246,.4)] hover:text-[#8B5CF6]" style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                  <ChevronRight size={13}/>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-zinc-600 mb-1 tracking-wider">
              {['D','L','M','M','J','V','S'].map((d,i) => <div key={`dow-${i}`}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map((day,i) => {
                const isSelected = selectedDate===day && reservasPeriodo==='dia';
                const hasRes = day && reservas.some(r => r.fecha===day && r.estado!=='cancelada');
                return (
                  <div key={i} className="aspect-square flex items-center justify-center">
                    {day ? (
                      <button
                        onClick={() => { setSelectedDate(day); setReservasPeriodo('dia'); }}
                        className="w-full h-full rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5"
                        style={isSelected ? {
                          background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                          color: 'white',
                          boxShadow: '0 4px 14px rgba(139,92,246,0.45)',
                        } : { color: 'var(--text-2)' }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(139,92,246,.1)'; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {new Date(day+'T12:00:00').getDate()}
                        {hasRes && (
                          <span className="w-1 h-1 rounded-full" style={{ background: isSelected ? 'white' : '#8B5CF6' }} />
                        )}
                      </button>
                    ) : <div />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Automatizaciones */}
          <div className="card p-5 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2"><Zap size={13} /> Automatizaciones</h4>
            {[
              { label:'Recordatorio automático', sub:'2h antes', val:autoReminder, set:setAutoReminder, color:'bg-amber-500' },
              { label:'Confirmar por WhatsApp', sub:'Al crear', val:autoWhatsApp, set:setAutoWhatsApp, color:'bg-[#25D366]' },
            ].map(({ label, sub, val, set:s, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-[11px] text-zinc-500">{sub}</p>
                </div>
                <button onClick={() => s(v => !v)}
                  className={`w-10 h-5.5 rounded-full relative border transition-all ${val ? `${color} border-transparent` : 'bg-zinc-800 border-zinc-700'}`}
                  style={{ height:'22px', width:'40px' }}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${val ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Lista reservas */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-zinc-300">
              {reservasPeriodo==='dia'
                ? `Reservas del ${new Date(selectedDate+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long'})}`
                : `Reservas — ${reservasPeriodo==='semana'?'esta semana':'este mes'}`}
            </h3>
            <span className="text-xs font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg">{dailyReservations.length} total</span>
          </div>

          <AnimatePresence>
            {dailyReservations.length > 0 ? dailyReservations.map(res => (
              <motion.div key={res.id} layout initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="card p-5 flex items-center justify-between gap-4 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-sm font-black">{res.hora}</span>
                    <Clock size={12} className="text-zinc-600 mt-0.5" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{res.nombre}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-zinc-500 flex items-center gap-1"><Users size={11}/> {res.personas} personas</span>
                      <span className="text-xs text-amber-400 flex items-center gap-1"><Utensils size={11}/> {res.mesa}</span>
                      {res.fecha !== selectedDate && <span className="text-[10px] text-zinc-600">{res.fecha}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <StatusBadge status={res.estado} />
                  {/* Pedido activo vinculado a esta reserva */}
                  {res.estado !== 'cancelada' && reservaPedidoMap[res.id] ? (
                    <button
                      onClick={() => { loadProductos(); openPedidoDetalle(reservaPedidoMap[res.id]); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors text-xs font-bold
                        bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500 hover:text-white"
                      title="Gestionar pedido activo">
                      <ChefHat size={13}/>
                      <span>Pedido · </span>
                      <StatusBadge status={reservaPedidoMap[res.id].estado} />
                    </button>
                  ) : res.estado !== 'cancelada' && (
                    <button onClick={() => { setCrearPedidoRes(res); }}
                      className="p-2 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 hover:bg-[#8B5CF6] hover:text-white transition-colors flex items-center gap-1.5 px-3 text-xs font-bold" title="Crear pedido desde reserva">
                      <ShoppingBag size={13}/> Crear Pedido
                    </button>
                  )}
                  {res.estado==='asistió' && (
                    <button onClick={() => { setSelectedReservaConsumo(res); setReservaConsumoModal(res); loadReservaConsumos(res.id); }}
                      className="p-2 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 hover:bg-[#8B5CF6] hover:text-white transition-colors" title="Gestionar Consumo">
                      <Utensils size={14}/>
                    </button>
                  )}
                  {res.estado==='pendiente' && (
                    <button onClick={() => updateReservaEstado(res.id,'confirmada')}
                      className="p-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500 hover:text-black transition-colors" title="Confirmar">
                      <Check size={14}/>
                    </button>
                  )}
                  {res.estado==='confirmada' && (
                    <button onClick={() => updateReservaEstado(res.id,'asistió')}
                      className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-colors" title="Asistió">
                      <UserCheck size={14}/>
                    </button>
                  )}
                  {res.estado !== 'cancelada' && res.estado !== 'asistió' && (
                    <button onClick={() => updateReservaEstado(res.id,'cancelada')}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors" title="Cancelar">
                      <X size={14}/>
                    </button>
                  )}
                  {res.telefono && (
                    <button onClick={() => sendWhatsApp(res.telefono, res.nombre, res.fecha, res.hora)}
                      className="p-2 rounded-lg bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366] hover:text-white transition-colors" title="WhatsApp">
                      <MessageCircle size={14}/>
                    </button>
                  )}
                  <button onClick={() => deleteReserva(res)}
                    className="p-2 rounded-lg bg-zinc-800 text-zinc-500 border border-zinc-700 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors" title="Eliminar">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </motion.div>
            )) : (
              <div className="py-16 flex flex-col items-center justify-center text-zinc-600 border border-dashed border-zinc-800 rounded-xl">
                <Calendar size={40} className="mb-3 opacity-30" />
                <p className="font-semibold text-sm">Sin reservas para este período</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal crear pedido desde reserva */}
      {crearPedidoRes && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={() => !crearPedidoLoading && setCrearPedidoRes(null)} />

          <motion.div
            initial={{ opacity:0, scale:0.93, y:16 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.93, y:16 }}
            transition={{ duration:0.25, ease:[0.16,1,0.3,1] }}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl"
            style={{ background:'#0f0f13', border:'1px solid rgba(139,92,246,.25)', boxShadow:'0 0 0 1px rgba(139,92,246,.1), 0 32px 64px rgba(0,0,0,.6)' }}
          >
            {/* Header con gradiente */}
            <div className="relative px-6 pt-6 pb-5 overflow-hidden"
              style={{ background:'linear-gradient(135deg,rgba(139,92,246,.18) 0%,rgba(109,40,217,.08) 100%)', borderBottom:'1px solid rgba(139,92,246,.15)' }}>
              <div className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage:'radial-gradient(circle at 70% 50%, #8B5CF6 0%, transparent 60%)' }} />
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background:'linear-gradient(135deg,#8B5CF6,#6D28D9)', boxShadow:'0 8px 20px rgba(139,92,246,.4)' }}>
                    <ShoppingBag size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base leading-tight">Abrir Pedido</h3>
                    <p className="text-[11px] font-medium mt-0.5" style={{ color:'rgba(139,92,246,.8)' }}>
                      desde reserva · vinculado automático
                    </p>
                  </div>
                </div>
                <button onClick={() => setCrearPedidoRes(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all">
                  <X size={15}/>
                </button>
              </div>

              {/* Avatar cliente */}
              <div className="relative mt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                  style={{ background:'linear-gradient(135deg,#F59E0B,#D97706)', boxShadow:'0 4px 12px rgba(245,158,11,.35)' }}>
                  {crearPedidoRes.nombre?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-black text-sm">{crearPedidoRes.nombre}</p>
                  <p className="text-[11px] text-zinc-500">{crearPedidoRes.personas} {crearPedidoRes.personas === 1 ? 'persona' : 'personas'}</p>
                </div>
              </div>
            </div>

            {/* Info rows */}
            <div className="px-6 py-4 flex flex-col gap-1">
              {[
                { icon: <Utensils size={13}/>, label:'Mesa', value: crearPedidoRes.mesa || '—', color:'#F59E0B', show: true },
                { icon: <Users size={13}/>, label:'Comensales', value:`${crearPedidoRes.personas} personas`, color:'#8B5CF6', show: true },
                { icon: <Clock size={13}/>, label:'Horario', value:`${crearPedidoRes.fecha} · ${crearPedidoRes.hora}`, color:'#3B82F6', show: true },
              ].filter(r => r.show).map(({ icon, label, value, color }) => (
                <div key={label} className="flex items-center gap-3 py-2.5 border-b last:border-0"
                  style={{ borderColor:'rgba(255,255,255,.05)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background:`${color}18`, color }}>
                    {icon}
                  </div>
                  <span className="text-zinc-500 text-xs flex-1">{label}</span>
                  <span className="text-white text-xs font-bold">{value}</span>
                </div>
              ))}
            </div>

            {/* Nota */}
            <div className="mx-6 mb-5 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5"
              style={{ background:'rgba(245,158,11,.07)', border:'1px solid rgba(245,158,11,.15)' }}>
              <AlertCircle size={12} className="flex-shrink-0 mt-0.5" style={{ color:'#F59E0B' }}/>
              <p className="text-[11px] leading-relaxed" style={{ color:'rgba(245,158,11,.85)' }}>
                El pedido se crea vacío. Agrega productos desde el panel de <strong>Pedidos</strong>.
              </p>
            </div>

            {/* Botones */}
            <div className="px-6 pb-6 flex gap-2.5">
              <button disabled={crearPedidoLoading} onClick={() => setCrearPedidoRes(null)}
                className="flex-1 py-2.5 rounded-xl text-zinc-400 hover:text-white font-semibold text-sm transition-all disabled:opacity-40"
                style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)' }}>
                Cancelar
              </button>
              <button
                disabled={crearPedidoLoading}
                onClick={() => handleCrearPedidoDesdeReserva(crearPedidoRes)}
                className="flex-1 py-2.5 rounded-xl text-white font-black text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: crearPedidoLoading ? 'rgba(139,92,246,.5)' : 'linear-gradient(135deg,#8B5CF6,#6D28D9)', boxShadow: crearPedidoLoading ? 'none' : '0 8px 20px rgba(139,92,246,.35)' }}>
                {crearPedidoLoading
                  ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Creando...</>
                  : <><ShoppingBag size={14}/> Abrir Pedido</>
                }
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
