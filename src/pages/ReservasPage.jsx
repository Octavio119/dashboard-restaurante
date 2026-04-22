import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Zap, Clock, Users, Utensils, 
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
  handleCrearPedidoDesdeReserva
}) {
  return (
    <motion.div key="reservas" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="p-8 flex flex-col gap-6 max-w-[1400px] w-full mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Módulo de <span className="text-amber-500">Reservas</span></h2>
          <p className="text-zinc-500 text-sm mt-1">Calendario y gestión de disponibilidad</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Calendario */}
        <div className="col-span-4 flex flex-col gap-4">
          <div className="card p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                {new Date(selectedDate+'T12:00:00').toLocaleDateString('es-ES', { month:'long', year:'numeric' })}
              </h3>
              <div className="flex gap-1">
                <button className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white"><ChevronRight className="rotate-180" size={14}/></button>
                <button className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white"><ChevronRight size={14}/></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-zinc-600 mb-1">
              {['D','L','M','M','J','V','S'].map((d,i) => <div key={`dow-${i}`}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map((day,i) => {
                const hasRes = day && reservas.some(r => r.fecha===day && r.estado!=='cancelada');
                return (
                  <div key={i} className="aspect-square flex items-center justify-center">
                    {day ? (
                      <button onClick={() => { setSelectedDate(day); setReservasPeriodo('dia'); }}
                        className={`w-full h-full rounded-lg text-xs font-bold transition-colors flex flex-col items-center justify-center gap-0.5 ${selectedDate===day && reservasPeriodo==='dia' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:bg-zinc-800'}`}>
                        {new Date(day+'T12:00:00').getDate()}
                        {hasRes && <span className={`w-1 h-1 rounded-full ${selectedDate===day && reservasPeriodo==='dia' ? 'bg-black' : 'bg-amber-500'}`} />}
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
        <div className="col-span-8 flex flex-col gap-4">
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
                      className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500 hover:text-black transition-colors flex items-center gap-1.5 px-3 text-xs font-bold" title="Crear pedido desde reserva">
                      <ShoppingBag size={13}/> Crear Pedido
                    </button>
                  )}
                  {res.estado==='asistió' && (
                    <button onClick={() => { setSelectedReservaConsumo(res); setReservaConsumoModal(res); loadReservaConsumos(res.id); }}
                      className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500 hover:text-black transition-colors" title="Gestionar Consumo">
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !crearPedidoLoading && setCrearPedidoRes(null)} />
          <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400"><ShoppingBag size={20}/></div>
              <div>
                <h3 className="font-black text-white text-base">Crear Pedido desde Reserva</h3>
                <p className="text-zinc-500 text-xs mt-0.5">Se vinculará automáticamente</p>
              </div>
              <button className="ml-auto text-zinc-500 hover:text-white" onClick={() => setCrearPedidoRes(null)}><X size={18}/></button>
            </div>

            <div className="bg-zinc-800 rounded-xl p-4 flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Cliente</span>
                <span className="text-white font-semibold">{crearPedidoRes.nombre}</span>
              </div>
              {crearPedidoRes.mesa && (
                <div className="flex justify-between text-zinc-400">
                  <span>Mesa</span>
                  <span className="text-amber-400 font-bold">{crearPedidoRes.mesa}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>Personas</span>
                <span className="text-white font-semibold">{crearPedidoRes.personas}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Fecha</span>
                <span className="text-white font-semibold">{crearPedidoRes.fecha} · {crearPedidoRes.hora}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 bg-zinc-800 rounded-lg px-3 py-2 flex items-start gap-2">
              <AlertCircle size={13} className="text-amber-400 flex-shrink-0 mt-0.5"/>
              El pedido se crea vacío. Podrás agregar productos desde el panel de Pedidos.
            </p>

            <div className="flex gap-2">
              <button disabled={crearPedidoLoading} onClick={() => setCrearPedidoRes(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white transition-colors text-sm font-semibold disabled:opacity-50">
                Cancelar
              </button>
              <button disabled={crearPedidoLoading} onClick={() => handleCrearPedidoDesdeReserva(crearPedidoRes)}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm transition-colors disabled:opacity-50">
                {crearPedidoLoading ? 'Creando...' : 'Crear Pedido'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
