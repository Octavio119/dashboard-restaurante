import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, Check, Search, Trash2, History, ShoppingBag,
  ChefHat, Utensils, Users, Package, Plus,
  Banknote, CreditCard, Smartphone, AlertTriangle, Receipt,
} from 'lucide-react';
import AdminCodeModal from '../ui/AdminCodeModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import ToastContainer from '../notifications/ToastContainer';
import OnboardingWizard from '../OnboardingWizard';
import Spinner from '../ui/Spinner';
import StatusBadge from '../ui/StatusBadge';

export default function GlobalModals({
  // ── Reservas ────────────────────────────────────────────────────────────
  isNewResModalOpen, setIsNewResModalOpen,
  newResData, setNewResData,
  addResLoading, addReservation,
  lastCreatedRes, setLastCreatedRes, sendWhatsApp,
  reservaConsumoModal, setReservaConsumoModal,
  selectedReservaConsumo,
  reservaItems,
  resConsumoBusqueda, setResConsumoBusqueda,
  resConsumoLoading,
  handleAddConsumo, handleDeleteConsumo, ejecutarCierreCuentaReserva,

  // ── Clientes ────────────────────────────────────────────────────────────
  selectedCustomer, setSelectedCustomer,
  clienteFormOpen, setClienteFormOpen,
  clienteForm, setClienteForm,
  saveCliente,

  // ── Inventario ──────────────────────────────────────────────────────────
  isMovModalOpen, setIsMovModalOpen,
  movimientoForm, setMovimientoForm,
  isSavingMov, saveMovimiento,
  successMessage,
  isProvModalOpen, setIsProvModalOpen,
  proveedorForm, setProveedorForm,
  saveProveedor,

  // ── Pedidos ─────────────────────────────────────────────────────────────
  pedidoConvertModal, setPedidoConvertModal,
  convertMetodo, setConvertMetodo,
  convertLoading, ejecutarConversionVenta,
  pedidoDetalle, setPedidoDetalle,
  pedidoDetalleItems, setPedidoDetalleItems,
  addItemSearch, setAddItemSearch,
  addItemLoading,
  handleAddPedidoItem, handleUpdatePedidoItemQty, handleDeletePedidoItem,
  updatePedidoEstado, confirmarConversionVenta,
  pedidoMesaView, loadMesasPedidos,

  // ── Shared data ─────────────────────────────────────────────────────────
  config,
  productos, productosLoading,
  proveedores,
  cajaHoy,

  // ── Global dialogs ──────────────────────────────────────────────────────
  confirmDialog, setConfirmDialog,
  adminModal, setAdminModal,
  toasts, removeToast,
  showOnboarding, setShowOnboarding,
  user, loadProductos, loadCategorias,
}) {
  return (
    <>
      {/* ── MODAL: Nueva Reserva ── */}
      <AnimatePresence>
        {isNewResModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setIsNewResModalOpen(false)} className="absolute inset-0 bg-black/85"/>
            <motion.div initial={{ opacity:0, scale:0.97, y:8 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.97 }}
              transition={{ duration:0.2, ease:[0.16,1,0.3,1] }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-white">Nueva <span style={{ color: 'var(--purple)' }}>Reserva</span></h3>
                <button onClick={() => setIsNewResModalOpen(false)} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"><X size={16}/></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:'Nombre', key:'name', type:'text', placeholder:'Juan Pérez', full:true },
                  { label:'Email (opcional)', key:'email', type:'email', placeholder:'juan@email.com', full:true },
                  { label:'Teléfono/WhatsApp', key:'phone', type:'tel', placeholder:'+56 9 0000 0000', full:false },
                  { label:'Personas', key:'people', type:'number', placeholder:'2', full:false },
                  { label:'Mesa (opcional)', key:'table', type:'text', placeholder:'Mesa 12', full:false },
                  { label:'Fecha', key:'date', type:'date', full:false },
                  { label:'Hora', key:'time', type:'time', full:false },
                ].map(({ label, key, type, placeholder, full }) => (
                  <div key={key} className={`flex flex-col gap-1.5 ${full ? 'col-span-2' : ''}`}>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</label>
                    <input type={type} value={newResData[key]} onChange={e => setNewResData({...newResData, [key]:e.target.value})}
                      placeholder={placeholder} className="input"/>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsNewResModalOpen(false)} className="btn-ghost flex-1">Cancelar</button>
                <button onClick={addReservation} disabled={!newResData.name || addResLoading} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                  {addResLoading ? 'Guardando...' : 'Crear Reservación'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── TOAST: WhatsApp post-reserva ── */}
      <AnimatePresence>
        {lastCreatedRes && (
          <motion.div
            initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:24 }}
            className="fixed bottom-6 right-6 z-[300] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 flex items-center gap-4 max-w-sm"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">Reserva guardada</p>
              <p className="text-xs text-zinc-400 truncate">{lastCreatedRes.nombre} · {(lastCreatedRes.fecha || '').toString().split('T')[0]} {lastCreatedRes.hora}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {lastCreatedRes.telefono && (
                <button
                  onClick={() => { sendWhatsApp(lastCreatedRes.telefono, lastCreatedRes.nombre, lastCreatedRes.fecha, lastCreatedRes.hora, 'confirmacion'); setLastCreatedRes(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors text-xs font-bold"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </button>
              )}
              <button onClick={() => setLastCreatedRes(null)} className="text-zinc-600 hover:text-white transition-colors p-1"><X size={14}/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Historial Cliente ── */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setSelectedCustomer(null)} className="absolute inset-0 bg-black/85"/>
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
              className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl font-black border border-amber-500/20">
                    {selectedCustomer.nombre?.charAt(0) || selectedCustomer.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{selectedCustomer.nombre || selectedCustomer.name}</h3>
                    <p className="text-sm text-zinc-500">{selectedCustomer.email}</p>
                    <div className="flex gap-2 mt-1">
                      {selectedCustomer.rut && (
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono font-bold">{selectedCustomer.rut}</span>
                      )}
                      {selectedCustomer.tipo_cliente === 'empresa' && selectedCustomer.razon_social && (
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold">{selectedCustomer.razon_social}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"><X size={16}/></button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="card p-4">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Visitas</p>
                  <p className="text-xl font-black mt-1">{selectedCustomer.visitas ?? selectedCustomer.visits}</p>
                </div>
                <div className="card p-4">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Ticket promedio</p>
                  <p className="text-xl font-black text-amber-400 mt-1">
                    ${((selectedCustomer.total_gastado ?? selectedCustomer.totalSpent) / Math.max(1, selectedCustomer.visitas ?? selectedCustomer.visits)).toFixed(2)}
                  </p>
                </div>
                <div className="card p-4">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total gastado</p>
                  <p className="text-xl font-black mt-1">${Number(selectedCustomer.total_gastado ?? selectedCustomer.totalSpent).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-none">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Historial</h4>
                {(selectedCustomer.pedidos || selectedCustomer.orders || []).map((o,i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-zinc-800/60 border border-zinc-700">
                    <div>
                      <p className="text-sm font-semibold">{o.numero || o.id}</p>
                      <p className="text-[11px] text-zinc-500">{o.items || o.item} · {o.fecha || o.date}</p>
                    </div>
                    <span className="font-black text-white">${Number(o.total).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="btn-primary w-full">Cerrar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Editar / Nuevo Cliente ── */}
      <AnimatePresence>
        {clienteFormOpen && clienteForm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setClienteFormOpen(false)} className="absolute inset-0 bg-black/85"/>
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black">{clienteForm.id ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                <button onClick={() => setClienteFormOpen(false)} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"><X size={16}/></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Nombre</label>
                  <input type="text" value={clienteForm.nombre} onChange={e=>setClienteForm({...clienteForm,nombre:e.target.value})} className="input" placeholder="Nombre completo"/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">RUT</label>
                  <input type="text" value={clienteForm.rut} onChange={e=>setClienteForm({...clienteForm,rut:e.target.value})} className="input font-mono" placeholder="12.345.678-9"/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Tipo</label>
                  <select value={clienteForm.tipo_cliente} onChange={e=>setClienteForm({...clienteForm,tipo_cliente:e.target.value})} className="input bg-zinc-800">
                    <option value="persona">Persona natural</option>
                    <option value="empresa">Empresa / Factura</option>
                  </select>
                </div>
                {clienteForm.tipo_cliente === 'empresa' && (
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Razón Social</label>
                    <input type="text" value={clienteForm.razon_social} onChange={e=>setClienteForm({...clienteForm,razon_social:e.target.value})} className="input" placeholder="Empresa SpA"/>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Email</label>
                  <input type="email" value={clienteForm.email} onChange={e=>setClienteForm({...clienteForm,email:e.target.value})} className="input" placeholder="email@ejemplo.com"/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Teléfono</label>
                  <input type="tel" value={clienteForm.telefono} onChange={e=>setClienteForm({...clienteForm,telefono:e.target.value})} className="input" placeholder="+56 9 0000 0000"/>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setClienteFormOpen(false)} className="btn-ghost flex-1">Cancelar</button>
                <button onClick={saveCliente} disabled={!clienteForm.nombre} className="btn-primary flex-1 disabled:opacity-50">Guardar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Registro de Movimiento ── */}
      <AnimatePresence>
        {isMovModalOpen && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setIsMovModalOpen(false)} className="absolute inset-0 bg-black/88"/>
            <motion.div initial={{ opacity:0, scale:0.97, y:8 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.97 }}
              transition={{ duration:0.2, ease:[0.16,1,0.3,1] }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 flex justify-between items-center" style={{ background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)' }}>
                <h3 className="font-black text-white">REGISTRAR MOVIMIENTO</h3>
                <button onClick={() => setIsMovModalOpen(false)} className="text-white/60 hover:text-white"><X size={18}/></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Producto</label>
                  <select value={movimientoForm.producto_id} onChange={e=>setMovimientoForm({...movimientoForm, producto_id: e.target.value})} className="input bg-zinc-800">
                    <option value="">Seleccione un producto...</option>
                    {(productos || []).map(p => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tipo</label>
                    <select value={movimientoForm.tipo} onChange={e=>setMovimientoForm({...movimientoForm, tipo: e.target.value})} className="input bg-zinc-800">
                      <option value="entrada">Entrada (+)</option>
                      <option value="salida">Salida (-)</option>
                      <option value="ajuste">Ajuste (Manual)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cantidad</label>
                    <input type="number" value={movimientoForm.cantidad} onChange={e=>setMovimientoForm({...movimientoForm, cantidad: e.target.value})} className="input" placeholder="0"/>
                  </div>
                </div>
                {movimientoForm.tipo === 'entrada' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Proveedor (Opcional)</label>
                    <select value={movimientoForm.proveedor_id} onChange={e=>setMovimientoForm({...movimientoForm, proveedor_id: e.target.value})} className="input bg-zinc-800">
                      <option value="">Ninguno</option>
                      {(proveedores || []).map(pr => <option key={pr.id} value={pr.id}>{pr.nombre}</option>)}
                    </select>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Notas / Referencia</label>
                  <textarea value={movimientoForm.notas} onChange={e=>setMovimientoForm({...movimientoForm, notas: e.target.value})} className="input min-h-[80px]" placeholder="Ej: Compra mensual, Merma, etc."/>
                </div>
                <button
                  onClick={saveMovimiento}
                  disabled={isSavingMov}
                  className={`btn-primary w-full py-4 font-black uppercase tracking-widest mt-2 shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 ${isSavingMov ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {isSavingMov ? <><Spinner size="sm" color="white" /> PROCESANDO...</> : 'Procesar Movimiento'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── TOAST: success global ── */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity:0, y:50 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[500] bg-zinc-900 border border-green-500/30 text-white px-6 py-3 rounded-full flex items-center gap-3"
            style={{ boxShadow: 'var(--shadow-xl)' }}
          >
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-black">
              <Check size={14} strokeWidth={4}/>
            </div>
            <span className="font-bold text-sm tracking-tight">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Nuevo / Editar Proveedor ── */}
      <AnimatePresence>
        {isProvModalOpen && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setIsProvModalOpen(false)} className="absolute inset-0 bg-black/88"/>
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                <h3 className="text-xl font-black text-white">{proveedorForm.id ? 'Editar' : 'Nuevo'} <span style={{ color: 'var(--purple)' }}>Proveedor</span></h3>
                <button onClick={() => setIsProvModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nombre de la Empresa</label>
                  <input type="text" value={proveedorForm.nombre} onChange={e=>setProveedorForm({...proveedorForm, nombre: e.target.value})} className="input" placeholder="Ej: Distribuidora Central"/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Persona de Contacto</label>
                  <input type="text" value={proveedorForm.contacto} onChange={e=>setProveedorForm({...proveedorForm, contacto: e.target.value})} className="input" placeholder="Juan Pérez"/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Teléfono</label>
                  <input type="tel" value={proveedorForm.telefono} onChange={e=>setProveedorForm({...proveedorForm, telefono: e.target.value})} className="input" placeholder="+56 9..."/>
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email</label>
                  <input type="email" value={proveedorForm.email} onChange={e=>setProveedorForm({...proveedorForm, email: e.target.value})} className="input" placeholder="proveedor@email.com"/>
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Dirección</label>
                  <input type="text" value={proveedorForm.direccion} onChange={e=>setProveedorForm({...proveedorForm, direccion: e.target.value})} className="input"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsProvModalOpen(false)} className="btn-ghost flex-1">Cancelar</button>
                <button onClick={saveProveedor} className="btn-primary flex-1 font-black uppercase tracking-widest">Guardar Proveedor</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Consumo de Reserva (Comandero) ── */}
      <AnimatePresence>
        {reservaConsumoModal && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setReservaConsumoModal(null)} className="absolute inset-0 bg-black/88"/>
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 flex justify-between items-center shrink-0" style={{ background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)' }}>
                <div>
                  <h3 className="font-black text-white leading-none uppercase">GESTIONAR CONSUMO</h3>
                  <p className="text-white/60 text-[10px] font-bold mt-1 uppercase">Mesa {reservaConsumoModal.mesa} • {reservaConsumoModal.nombre}</p>
                </div>
                <button onClick={() => setReservaConsumoModal(null)} className="text-black/60 hover:text-black"><X size={18}/></button>
              </div>
              <div className="flex flex-1 overflow-hidden">
                {/* Product search */}
                <div className="w-1/2 border-r border-zinc-800 flex flex-col bg-zinc-900/50">
                  <div className="p-4 border-b border-zinc-800">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14}/>
                      <input
                        type="text"
                        value={resConsumoBusqueda}
                        onChange={(e) => setResConsumoBusqueda(e.target.value)}
                        placeholder="Buscar producto..."
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                    <div className="grid grid-cols-1 gap-1">
                      {(productos || [])
                        .filter(p => p.nombre.toLowerCase().includes(resConsumoBusqueda.toLowerCase()))
                        .map(p => (
                          <button key={p.id} onClick={() => handleAddConsumo(p)}
                            className="w-full p-3 rounded-lg hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all flex justify-between items-center group">
                            <div className="text-left">
                              <p className="text-sm font-bold text-white group-hover:text-[#8B5CF6]">{p.nombre}</p>
                              <p className="text-[10px] text-zinc-500">Stock: {p.stock} • {p.categoria}</p>
                            </div>
                            <span className="text-amber-500 font-black text-sm">{config.currency}{p.precio}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
                {/* Consumption detail */}
                <div className="w-1/2 flex flex-col">
                  <div className="p-4 bg-zinc-800/20 border-b border-zinc-800">
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <History size={12}/> Detalle de la Mesa
                    </h4>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-hide">
                    {(reservaItems || []).length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 py-10 text-center">
                        <ShoppingBag size={30} className="opacity-20 mb-2"/>
                        <p className="text-xs font-medium">No hay consumos registrados</p>
                      </div>
                    ) : (
                      (reservaItems || []).map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-zinc-800/50 border border-zinc-800">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{item.nombre}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8B5CF6]/10 text-[#8B5CF6] font-black">x{item.cantidad}</span>
                              <span className="text-[10px] text-zinc-500">{config.currency}{Number(item.precio_unitario).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-sm font-black text-white">{config.currency}{Number(item.cantidad * item.precio_unitario).toLocaleString()}</span>
                            <button onClick={() => handleDeleteConsumo(item.id)} className="p-1.5 rounded-lg text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                              <Trash2 size={12}/>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-6 bg-zinc-900 border-t border-zinc-800">
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Total Acumulado</span>
                      <span className="text-2xl font-black text-white">
                        {config.currency}{(reservaItems || []).reduce((acc, i) => acc + (i.cantidad * i.precio_unitario), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setReservaConsumoModal(null)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-sm hover:bg-zinc-700 transition-colors">
                        Cerrar
                      </button>
                      <button
                        onClick={ejecutarCierreCuentaReserva}
                        disabled={(reservaItems || []).length === 0 || resConsumoLoading}
                        className="flex-1 py-3 rounded-xl text-white font-black text-sm transition-colors disabled:opacity-50"
                        style={{ background:'#7C3AED' }}
                        onMouseEnter={e => e.currentTarget.style.background='#6D28D9'}
                        onMouseLeave={e => e.currentTarget.style.background='#7C3AED'}
                      >
                        {resConsumoLoading ? 'Cerrando...' : 'PAGAR Y CERRAR'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Conversión Pedido → Venta ── */}
      {pedidoConvertModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/88" onClick={() => !convertLoading && setPedidoConvertModal(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm flex flex-col"
            style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <h3 className="text-base font-bold" style={{ color: '#F8FAFC', letterSpacing: '-0.01em' }}>Registrar venta</h3>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{pedidoConvertModal.numero} · {pedidoConvertModal.cliente_nombre}</p>
              </div>
              <button
                onClick={() => !convertLoading && setPedidoConvertModal(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: '#475569', background: 'rgba(255,255,255,0.04)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94A3B8'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#475569'; }}
              >
                <X size={14} />
              </button>
            </div>
            <div className="px-6 py-4 flex flex-col gap-2.5">
              {(pedidoConvertModal.items||[]).length > 0 ? (
                pedidoConvertModal.items.map(it => (
                  <div key={it.id} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#94A3B8' }}>
                      {it.nombre}
                      <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#64748B' }}>×{it.cantidad}</span>
                    </span>
                    <span className="text-sm font-semibold" style={{ color: '#E2E8F0', fontVariantNumeric: 'tabular-nums' }}>
                      ${(it.cantidad * it.precio_unitario).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#94A3B8' }}>{pedidoConvertModal.item}</span>
                  <span className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>—</span>
                </div>
              )}
            </div>
            <div className="mx-6 mb-5 flex items-center justify-between rounded-xl px-4 py-4"
              style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <span className="text-sm font-semibold" style={{ color: '#94A3B8' }}>Total a cobrar</span>
              <span className="text-2xl font-black" style={{ color: '#10B981', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                ${Number(pedidoConvertModal.total).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
              </span>
            </div>
            <div className="px-6 pb-4 flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#334155' }}>Método de pago</span>
              <div className="flex gap-2">
                {[
                  { id: 'efectivo',      label: 'Efectivo',      icon: Banknote },
                  { id: 'tarjeta',       label: 'Tarjeta',       icon: CreditCard },
                  { id: 'transferencia', label: 'Transferencia', icon: Smartphone },
                ].map(m => {
                  const active = convertMetodo === m.id;
                  return (
                    <button key={m.id} onClick={() => setConvertMetodo(m.id)}
                      className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: active ? 'rgba(248,250,252,0.09)' : 'rgba(255,255,255,0.03)',
                        border: active ? '1px solid rgba(248,250,252,0.18)' : '1px solid rgba(255,255,255,0.05)',
                        color: active ? '#F8FAFC' : '#475569',
                      }}
                    >
                      <m.icon size={15} />{m.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {cajaHoy?.estado !== 'abierta' && (
              <div className="mx-6 mb-3 flex items-center gap-2 text-xs rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.18)', color: '#CA8A04' }}>
                <AlertTriangle size={12} className="flex-shrink-0" />
                La caja no está abierta. La venta se registrará igual.
              </div>
            )}
            <div className="flex gap-2.5 px-6 pb-5">
              <button
                disabled={convertLoading}
                onClick={() => setPedidoConvertModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748B' }}
                onMouseEnter={e => { if (!convertLoading) { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; } }}
                onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
              >
                Cancelar
              </button>
              <button
                disabled={convertLoading}
                onClick={ejecutarConversionVenta}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: '#10B981', color: '#fff' }}
                onMouseEnter={e => { if (!convertLoading) e.currentTarget.style.background = '#059669'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#10B981'; }}
              >
                <Receipt size={14} />
                {convertLoading ? 'Registrando...' : 'Confirmar venta'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── MODAL: Gestión de ítems de pedido ── */}
      <AnimatePresence>
        {pedidoDetalle && (
          <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4">
            <motion.div
              key="pedido-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/88"
              onClick={() => { setPedidoDetalle(null); setPedidoDetalleItems([]); }}
            />
            <motion.div
              key="pedido-modal"
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden rounded-3xl"
              style={{ background: '#09090D', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 0 0 1px rgba(139,92,246,0.12), 0 32px 80px rgba(0,0,0,0.85), 0 0 80px rgba(139,92,246,0.07)' }}
            >
              {/* Header */}
              <div className="relative flex items-center justify-between px-6 py-5 overflow-hidden flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,rgba(139,92,246,.14) 0%,rgba(109,40,217,.05) 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="pointer-events-none absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-15"
                  style={{ background: 'radial-gradient(circle,#8B5CF6 0%,transparent 70%)' }} />
                <div className="relative flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}>
                    <ChefHat size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-amber-400 text-base leading-tight tracking-tight">{pedidoDetalle.numero}</span>
                      <span className="text-zinc-600 text-sm">—</span>
                      <span className="font-bold text-white text-base">{pedidoDetalle.cliente_nombre}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {pedidoDetalle.mesa && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400/80"><Utensils size={9}/>{pedidoDetalle.mesa}</span>
                      )}
                      {pedidoDetalle.personas > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-zinc-600"><Users size={9}/>{pedidoDetalle.personas} pers.</span>
                      )}
                      {pedidoDetalle.reserva_id && (
                        <span className="text-[10px] font-black text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded" style={{ background: 'rgba(99,102,241,.08)' }}>RESERVA</span>
                      )}
                      <StatusBadge status={pedidoDetalle.estado}/>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setPedidoDetalle(null); setPedidoDetalleItems([]); }}
                  className="relative w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white transition-all cursor-pointer flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
                >
                  <X size={14}/>
                </button>
              </div>

              {/* Body */}
              <div className="flex flex-col gap-5 overflow-y-auto flex-1 px-6 py-5">
                <div>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.14em] mb-3">Productos del pedido</p>
                  {(pedidoDetalleItems || []).length === 0 ? (
                    <div className="py-8 flex flex-col items-center text-zinc-700 rounded-2xl" style={{ border: '1px dashed rgba(255,255,255,0.06)' }}>
                      <Package size={26} className="mb-2 opacity-25"/>
                      <p className="text-sm">Sin productos — agrega del menú</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {(pedidoDetalleItems || []).map(item => (
                        <div key={item.id}
                          className="flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-colors cursor-default"
                          style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.05)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.055)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{item.nombre}</p>
                            <p className="text-[11px] text-zinc-600 mt-0.5">${item.precio_unitario.toLocaleString('es-CL', { minimumFractionDigits:0 })} c/u</p>
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0" style={{ background: 'rgba(255,255,255,.06)', borderRadius: '12px', padding: '3px' }}>
                            <button onClick={() => handleUpdatePedidoItemQty(item.id, item.cantidad - 1)}
                              className="w-7 h-7 rounded-[9px] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer font-bold text-base leading-none">−</button>
                            <span data-testid="item-cantidad" className="text-white font-black text-sm w-6 text-center tabular-nums select-none">{item.cantidad}</span>
                            <button onClick={() => handleUpdatePedidoItemQty(item.id, item.cantidad + 1)}
                              className="w-7 h-7 rounded-[9px] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer font-bold text-base leading-none">+</button>
                          </div>
                          <span className="text-amber-400 font-black text-sm w-20 text-right tabular-nums flex-shrink-0">
                            ${(item.cantidad * item.precio_unitario).toLocaleString('es-CL', { minimumFractionDigits:0 })}
                          </span>
                          <button onClick={() => handleDeletePedidoItem(item.id)} className="text-zinc-700 hover:text-red-400 transition-colors cursor-pointer p-1 flex-shrink-0">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-3.5 mt-1 px-1" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
                        <span className="text-zinc-500 text-sm font-semibold">Total del pedido</span>
                        <span className="text-white font-black text-xl tabular-nums">
                          ${(pedidoDetalleItems || []).reduce((s, i) => s + i.cantidad * i.precio_unitario, 0).toLocaleString('es-CL', { minimumFractionDigits:0 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add from menu */}
                <div>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.14em] mb-3">Agregar del menú</p>
                  <div className="relative mb-3">
                    <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                    <input
                      value={addItemSearch}
                      onChange={e => setAddItemSearch(e.target.value)}
                      placeholder="Buscar producto..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-zinc-600 outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}
                      onFocus={e => { e.target.style.border = '1px solid rgba(139,92,246,.45)'; e.target.style.background = 'rgba(139,92,246,.04)'; }}
                      onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,.07)'; e.target.style.background = 'rgba(255,255,255,.04)'; }}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 max-h-52 overflow-y-auto">
                    {productosLoading ? (
                      <div className="flex items-center justify-center py-7 gap-2 text-sm text-zinc-600">
                        <Spinner size="sm" color="violet" /> Cargando menú...
                      </div>
                    ) : (() => {
                      const list = (productos || []).filter(p => p.activo !== 0 && (addItemSearch === '' || p.nombre.toLowerCase().includes(addItemSearch.toLowerCase())));
                      if (list.length === 0) return <p className="text-center text-zinc-600 text-sm py-6">Sin resultados</p>;
                      return list.map(prod => {
                        const isLoading = addItemLoading === prod.id;
                        const inCart = (pedidoDetalleItems || []).find(i => i.producto_id === prod.id);
                        return (
                          <button key={prod.id} disabled={isLoading} onClick={() => handleAddPedidoItem(prod)}
                            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer disabled:opacity-50 group"
                            style={{ border: '1px solid transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,.08)'; e.currentTarget.style.border = '1px solid rgba(139,92,246,.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.border = '1px solid transparent'; }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {inCart ? (
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                                  style={{ background: 'rgba(139,92,246,.2)', color: '#A78BFA' }}>{inCart.cantidad}</span>
                              ) : (
                                <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,.04)' }}>
                                  <Plus size={10} className="text-zinc-600 group-hover:text-violet-400 transition-colors" />
                                </span>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">{prod.nombre}</p>
                                <p className="text-[10px] text-zinc-600 capitalize">{prod.categoria} · Stock: {prod.stock}</p>
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-3">
                              {isLoading ? <Spinner size="sm" color="violet" /> : <span className="text-amber-400 font-black text-sm tabular-nums">${prod.precio.toLocaleString('es-CL', { minimumFractionDigits:0 })}</span>}
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 pt-4 flex gap-2.5 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
                {pedidoDetalle.estado !== 'confirmado' && pedidoDetalle.estado !== 'entregado' && (
                  <button
                    onClick={async () => {
                      const flow = ['pendiente','en preparación','entregado'];
                      const ni = flow.indexOf(pedidoDetalle.estado) + 1;
                      if (ni < flow.length) {
                        await updatePedidoEstado(pedidoDetalle.id, flow[ni]);
                        setPedidoDetalle(prev => ({ ...prev, estado: flow[ni] }));
                        if (pedidoMesaView) loadMesasPedidos();
                      }
                    }}
                    className="flex-1 py-3 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 cursor-pointer"
                    style={{ background: '#7C3AED', transition: 'background 150ms' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#6D28D9'}
                    onMouseLeave={e => e.currentTarget.style.background = '#7C3AED'}
                  >
                    <ChefHat size={16}/>
                    {pedidoDetalle.estado === 'pendiente' ? 'Pasar a preparación' : 'Marcar entregado'}
                  </button>
                )}
                {pedidoDetalle.estado === 'entregado' && (
                  <button
                    onClick={() => { const p = pedidoDetalle; setPedidoDetalle(null); setPedidoDetalleItems([]); confirmarConversionVenta(p); }}
                    className="flex-1 py-3 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 cursor-pointer"
                    style={{ background: '#10B981', transition: 'background 150ms' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#059669'}
                    onMouseLeave={e => e.currentTarget.style.background = '#10B981'}
                  >
                    <Receipt size={15}/> Cobrar y registrar venta
                  </button>
                )}
                {pedidoDetalle.estado === 'confirmado' && (
                  <div className="flex-1 py-3 rounded-2xl text-emerald-400 font-black text-sm flex items-center justify-center gap-2"
                    style={{ background: 'rgba(16,185,129,.07)', border: '1px solid rgba(16,185,129,.15)' }}>
                    <Check size={15}/> Venta registrada
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Global dialogs ── */}
      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title || ''}
        message={confirmDialog?.message || ''}
        onConfirm={confirmDialog?.onConfirm || (() => setConfirmDialog(null))}
        onCancel={() => setConfirmDialog(null)}
        danger={confirmDialog?.danger !== false}
      />

      <AdminCodeModal
        open={!!adminModal}
        title={adminModal?.title || ''}
        message={adminModal?.message || ''}
        onConfirm={adminModal?.onConfirm || (() => {})}
        onCancel={() => setAdminModal(null)}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {showOnboarding && (
        <OnboardingWizard
          user={user}
          onComplete={() => { setShowOnboarding(false); loadProductos(); loadCategorias(); }}
          onDismiss={() => setShowOnboarding(false)}
        />
      )}
    </>
  );
}
