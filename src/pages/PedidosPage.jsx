import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  List, LayoutGrid, Plus, TableProperties, RefreshCw, Utensils,
  Users, ChefHat, Check, Receipt, ShoppingBag, Printer, ChevronRight,
  MoreVertical, Trash2, X, ShoppingCart, Clock, DollarSign
} from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';

export default function PedidosPage({
  pedidoMesaView, setPedidoMesaView,
  loadMesasPedidos, mesasPedidos,
  salesFilter, setSalesFilter,
  dateFilter, setDateFilter,
  filteredOrders, ventasFiltro,
  pedidoForm, setPedidoForm,
  pedidoItems, setPedidoItems,
  pedidoSearch, setPedidoSearch,
  pedidoCatFilter, setPedidoCatFilter,
  pedidoModal, setPedidoModal,
  openPedidoDetalle, printPedido, confirmarConversionVenta, updatePedidoEstado, deletePedido,
  productos, loadProductos, productosLoading,
  clienteSearchResults, setClienteSearchResults, isSearchingClientes,
  pedidoLoading, setPedidoLoading,
  setPedidos, api
}) {

  const [pedidoError, setPedidoError] = React.useState(null);

  const cats = ['Todos', ...new Set(productos.filter(p => p.activo).map(p => p.categoria))];
  const prodsFiltrados = productos.filter(p => p.activo &&
    (pedidoCatFilter === 'Todos' || p.categoria === pedidoCatFilter) &&
    (!pedidoSearch || p.nombre.toLowerCase().includes(pedidoSearch.toLowerCase()))
  );
  const totalPedido = pedidoItems.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);

  const addItem = (prod) => {
    setPedidoItems(prev => {
      const ex = prev.find(i => i.producto_id === prod.id);
      if (ex) return prev.map(i => i.producto_id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { producto_id: prod.id, nombre: prod.nombre, precio_unitario: prod.precio, cantidad: 1 }];
    });
  };

  const changeQty = (producto_id, delta) => {
    setPedidoItems(prev => {
      const updated = prev.map(i => i.producto_id === producto_id ? { ...i, cantidad: i.cantidad + delta } : i);
      return updated.filter(i => i.cantidad > 0);
    });
  };

  const handleCreatePedido = async () => {
    setPedidoError(null);
    try {
      setPedidoLoading(true);
      const nuevo = await api.createPedido({
        cliente_nombre: pedidoForm.cliente_nombre,
        mesa:  pedidoForm.mesa,
        items: pedidoItems,
      });
      setPedidos(p => [nuevo, ...p]);
      setPedidoModal(false);
      setPedidoItems([]);
      setPedidoForm({ cliente_nombre:'', mesa:'' });
      setPedidoSearch('');
      setPedidoCatFilter('Todos');
    } catch(e) { setPedidoError(e.message); }
    finally { setPedidoLoading(false); }
  };

  return (
    <motion.div key="pedidos" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="p-4 sm:p-8 flex flex-col gap-6 max-w-[1200px] w-full mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Gestión de <span style={{ color: 'var(--primary)' }}>Pedidos</span></h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Control de comandas en tiempo real</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="tab-group">
            <button
              onClick={() => setPedidoMesaView(false)}
              className={`tab-item flex items-center gap-1.5 ${!pedidoMesaView ? 'active' : ''}`}
            >
              <List size={12} /> Lista
            </button>
            <button
              onClick={() => { setPedidoMesaView(true); loadMesasPedidos(); }}
              className={`tab-item flex items-center gap-1.5 ${pedidoMesaView ? 'active' : ''}`}
            >
              <LayoutGrid size={12} /> Por Mesa
            </button>
          </div>
          {!pedidoMesaView && (
            <>
              <div className="tab-group">
                {['dia', 'semana', 'mes'].map(p => (
                  <button
                    key={p}
                    onClick={() => setSalesFilter(p)}
                    className={`tab-item ${salesFilter === p ? 'active' : ''}`}
                  >
                    {p === 'dia' ? 'HOY' : p === 'semana' ? 'SEMANA' : 'MES'}
                  </button>
                ))}
              </div>
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="input text-sm"
              />
            </>
          )}
          <button
            onClick={() => { loadProductos(); setPedidoForm({ cliente_nombre: '', mesa: '' }); setPedidoItems([]); setPedidoSearch(''); setPedidoCatFilter('Todos'); setPedidoError(null); setPedidoModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} /> Nuevo pedido
          </button>
        </div>
      </div>

      {/* Cards resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: `Pedidos ${salesFilter === 'dia' ? 'hoy' : salesFilter === 'semana' ? 'semana' : 'mes'}`,
            value: filteredOrders.length,
            Icon: ShoppingBag,
            color: '#8B5CF6',
            dimColor: 'var(--purple-dim)',
          },
          {
            label: 'Pendientes',
            value: filteredOrders.filter(o => o.estado === 'pendiente').length,
            Icon: Clock,
            color: '#F59E0B',
            dimColor: 'var(--yellow-dim)',
          },
          {
            label: 'En preparación',
            value: filteredOrders.filter(o => o.estado === 'en preparación').length,
            Icon: ChefHat,
            color: '#3B82F6',
            dimColor: 'var(--blue-dim)',
          },
          {
            label: `Ventas ${salesFilter === 'dia' ? 'hoy' : salesFilter === 'semana' ? 'semana' : 'mes'}`,
            value: `$${ventasFiltro.toLocaleString('es-CL', { minimumFractionDigits: 2 })}`,
            Icon: DollarSign,
            color: '#10B981',
            dimColor: 'var(--teal-dim)',
          },
        ].map((s, i) => (
          <div
            key={i}
            className="dash-card metric-card flex flex-col gap-4 cursor-default"
            style={{
              borderTop: `2px solid ${s.color}`,
              background: `linear-gradient(135deg, ${s.color}0D 0%, var(--bg-card-2) 60%)`,
            }}
          >
            <div className="metric-icon" style={{ background: s.dimColor }}>
              <s.Icon size={17} style={{ color: s.color }} />
            </div>
            <div>
              <p className="metric-label">{s.label}</p>
              <h3 className="metric-value" style={{ color: s.color }}>{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* ── Vista Por Mesa ── */}
      {pedidoMesaView && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-zinc-300 flex items-center gap-2">
                <TableProperties size={16} style={{ color: 'var(--purple)' }}/> Plano de mesas
              </h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"/>Pendiente</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"/>En preparación</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"/>Entregado</span>
              </div>
            </div>
            <button onClick={loadMesasPedidos} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
              <RefreshCw size={12}/> Actualizar
            </button>
          </div>

          {mesasPedidos.length === 0 ? (
            <div className="py-20 flex flex-col items-center text-zinc-600 border border-dashed border-zinc-800 rounded-2xl">
              <TableProperties size={48} className="mb-3 opacity-20"/>
              <p className="font-bold text-sm">Sin mesas activas en este momento</p>
              <p className="text-xs mt-1 opacity-60">Los pedidos aparecerán aquí cuando tengan mesa asignada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {mesasPedidos.map(({ mesa, pedidos: mp }, cardIdx) => {
                const total = mp.reduce((s, p) => s + parseFloat(p.total||0), 0);
                const allEstados = mp.map(p => p.estado);
                const dominante = allEstados.includes('entregado') ? 'entregado'
                  : allEstados.includes('en preparación') ? 'en preparación' : 'pendiente';
                const accentColor = dominante === 'entregado' ? '#10B981'
                  : dominante === 'en preparación' ? '#3B82F6' : '#F59E0B';

                return (
                  <motion.div
                    key={mesa}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: cardIdx * 0.05, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="relative flex flex-col overflow-hidden rounded-2xl"
                    style={{
                      background: '#0F172A',
                      border: '1px solid rgba(255,255,255,0.06)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    }}
                  >
                    {/* Status accent strip */}
                    <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: accentColor }} />

                    {/* Card header */}
                    <div className="px-5 pt-5 pb-4 flex items-center justify-between"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-black"
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#F8FAFC' }}>
                          {mesa.replace(/[^0-9]/g,'') || <Utensils size={16}/>}
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ color: '#F8FAFC' }}>{mesa}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                            {mp.length} pedido{mp.length!==1?'s':''} · {mp.reduce((s,p)=>(p.items||[]).reduce((a,i)=>a+i.cantidad,0)+s,0)} ítems
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#334155' }}>Total</p>
                        <p className="text-xl font-black" style={{ color: '#F8FAFC', fontVariantNumeric: 'tabular-nums' }}>
                          ${total.toLocaleString('es-CL', { minimumFractionDigits:0, maximumFractionDigits:0 })}
                        </p>
                      </div>
                    </div>

                    {/* Orders */}
                    <div className="flex flex-col flex-1 divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      {mp.map(pedido => (
                        <div key={pedido.id} className="px-5 py-4 flex flex-col gap-3">

                          {/* Order header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold" style={{ color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
                                  {pedido.numero}
                                </span>
                                {pedido.reserva_id && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                                    style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.2)' }}>
                                    RESERVA
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold mt-0.5" style={{ color: '#E2E8F0' }}>{pedido.cliente_nombre}</p>
                              {pedido.personas > 0 && (
                                <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: '#475569' }}>
                                  <Users size={10}/> {pedido.personas} personas
                                </p>
                              )}
                            </div>
                            <StatusBadge status={pedido.estado}/>
                          </div>

                          {/* Items — clean rows, no nested box */}
                          {pedido.items && pedido.items.length > 0 ? (
                            <div className="flex flex-col gap-1.5">
                              {pedido.items.map(it => (
                                <div key={it.id} className="flex justify-between items-center text-xs">
                                  <span style={{ color: '#94A3B8' }}>
                                    {it.nombre}
                                    <span className="ml-1.5" style={{ color: '#475569' }}>×{it.cantidad}</span>
                                  </span>
                                  <span className="font-semibold" style={{ color: '#CBD5E1', fontVariantNumeric: 'tabular-nums' }}>
                                    ${(it.cantidad*it.precio_unitario).toLocaleString('es-CL',{minimumFractionDigits:0})}
                                  </span>
                                </div>
                              ))}
                              <div className="flex justify-between text-xs font-semibold pt-1.5 mt-0.5"
                                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: '#475569' }}>Subtotal</span>
                                <span style={{ color: '#F8FAFC', fontVariantNumeric: 'tabular-nums' }}>
                                  ${parseFloat(pedido.total||0).toLocaleString('es-CL',{minimumFractionDigits:0})}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="py-1 text-xs" style={{ color: '#334155' }}>Sin productos aún</div>
                          )}

                          {/* Actions */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => { loadProductos(); openPedidoDetalle(pedido); }}
                              className="py-2 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              style={{ background: 'rgba(255,255,255,0.04)', color: '#64748B', border: '1px solid rgba(255,255,255,0.06)' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                            >
                              <Plus size={12}/> Productos
                            </button>

                            {pedido.estado === 'pendiente' && (
                              <button
                                onClick={() => updatePedidoEstado(pedido.id, 'en preparación').then(loadMesasPedidos)}
                                className="py-2 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                style={{ background: 'rgba(59,130,246,0.1)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.15)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.2)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; }}
                              >
                                <ChefHat size={12}/> Preparar
                              </button>
                            )}
                            {pedido.estado === 'en preparación' && (
                              <button
                                onClick={() => updatePedidoEstado(pedido.id, 'entregado').then(loadMesasPedidos)}
                                className="py-2 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.15)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.2)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
                              >
                                <Check size={12}/> Entregar
                              </button>
                            )}
                            {pedido.estado === 'entregado' && (
                              <button
                                onClick={() => confirmarConversionVenta(pedido)}
                                className="py-2 text-[11px] font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                style={{ background: '#10B981', color: '#fff' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#059669'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#10B981'; }}
                              >
                                <Receipt size={12}/> Cobrar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Multi-order mesa total footer */}
                    {mp.length > 1 && (
                      <div className="px-5 py-3 flex items-center justify-between"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                        <span className="text-xs font-semibold" style={{ color: '#475569' }}>Total mesa</span>
                        <span className="font-black" style={{ color: '#10B981', fontVariantNumeric: 'tabular-nums' }}>
                          ${total.toLocaleString('es-CL', { minimumFractionDigits:2 })}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tabla de pedidos ── */}
      <div className={`card ${pedidoMesaView ? 'hidden' : ''}`}>
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="font-bold text-white">
            Pedidos — {salesFilter==='dia' ? dateFilter : salesFilter==='semana' ? 'esta semana' : 'este mes'}
          </h3>
          <span className="text-zinc-500 text-xs">{filteredOrders.length} pedidos</span>
        </div>
        <div className="overflow-x-auto">
        {filteredOrders.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase">
                <th className="px-6 py-3 text-left font-semibold">N° Pedido</th>
                <th className="px-6 py-3 text-left font-semibold">Cliente</th>
                <th className="px-6 py-3 text-left font-semibold">Item</th>
                <th className="px-6 py-3 text-left font-semibold">Estado</th>
                <th className="px-6 py-3 text-right font-semibold">Total</th>
                <th className="px-6 py-3"/>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr
                  key={order.id}
                  data-testid="pedido-item"
                  onClick={() => openPedidoDetalle(order)}
                  className="border-b border-zinc-800/40 transition-all cursor-pointer group/row"
                  style={{ borderLeft: '2px solid transparent' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(139,92,246,.05)';
                    e.currentTarget.style.borderLeft = '2px solid rgba(139,92,246,.5)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderLeft = '2px solid transparent';
                  }}
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-amber-400 font-black text-xs group-hover/row:text-amber-300 transition-colors">{order.numero}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-white text-sm">{order.cliente_nombre}</td>
                  <td className="px-6 py-4 text-zinc-500 text-xs max-w-[180px] truncate">{order.item}</td>
                  <td className="px-6 py-4"><StatusBadge status={order.estado}/></td>
                  <td className="px-6 py-4 text-right font-black text-white tabular-nums">${Number(order.total).toLocaleString('es-CL', { minimumFractionDigits:0 })}</td>
                  <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); openPedidoDetalle(order); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-amber-400 hover:bg-amber-400/10 transition-all cursor-pointer" title="Gestionar productos">
                        <ChefHat size={13}/>
                      </button>
                      {order.estado === 'confirmado' ? (
                        <button onClick={e => { e.stopPropagation(); printPedido(order); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-amber-400 hover:bg-amber-400/10 transition-all cursor-pointer" title="Imprimir ticket">
                          <Printer size={13}/>
                        </button>
                      ) : (
                        <button disabled className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-800 cursor-not-allowed" title="Solo disponible cuando confirmado">
                          <Printer size={13}/>
                        </button>
                      )}
                      {order.estado === 'entregado' && (
                        <button onClick={e => { e.stopPropagation(); confirmarConversionVenta(order); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-black transition-all cursor-pointer" title="Registrar venta">
                          <Receipt size={13}/>
                        </button>
                      )}
                      {order.estado !== 'entregado' && order.estado !== 'confirmado' && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            const flow = ['pendiente','en preparación','entregado'];
                            const ni = flow.indexOf(order.estado)+1;
                            if (ni < flow.length) updatePedidoEstado(order.id, flow[ni]);
                          }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-violet-400 hover:bg-violet-400/10 transition-all cursor-pointer" title="Avanzar estado">
                          <ChevronRight size={13}/>
                        </button>
                      )}
                      <div className="relative group/menu" onClick={e => e.stopPropagation()}>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                          <MoreVertical size={13}/>
                        </button>
                        <div className="absolute bottom-full right-0 mb-1 w-44 rounded-xl shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden"
                          style={{ background: 'rgba(15,15,20,.97)', border: '1px solid rgba(255,255,255,.08)', backdropFilter: 'blur(16px)' }}>
                          {['pendiente','en preparación','entregado'].map(s => (
                            <button key={s}
                              onClick={() => updatePedidoEstado(order.id, s)}
                              className="w-full text-left px-3 py-2.5 text-xs text-zinc-400 hover:bg-white/5 hover:text-white transition-colors border-b last:border-0 capitalize"
                              style={{ borderColor: 'rgba(255,255,255,.05)' }}>
                              → {s}
                            </button>
                          ))}
                          <button onClick={() => confirmarConversionVenta(order)}
                            className="w-full text-left px-3 py-2.5 text-xs text-green-400 hover:bg-green-500/10 transition-colors border-b"
                            style={{ borderColor: 'rgba(255,255,255,.05)' }}>
                            → Registrar venta
                          </button>
                          <button onClick={() => deletePedido(order)}
                            className="w-full text-left px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                            <Trash2 size={12}/> Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
            <ShoppingBag size={40} className="mb-3 opacity-30"/>
            <p className="font-semibold">Sin pedidos para esta fecha</p>
          </div>
        )}
      </div>
    </div>

      {/* Modal nuevo pedido */}
      {pedidoModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setPedidoModal(false); setPedidoError(null); }} />
          <motion.div initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
            className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h3 className="font-black text-white text-lg">Nuevo Pedido</h3>
              <button onClick={() => { setPedidoModal(false); setPedidoError(null); }} className="text-zinc-500 hover:text-white transition-colors"><X size={18}/></button>
            </div>

            <div className="flex gap-3 px-6 py-3 border-b border-zinc-800">
              <div className="flex-1 relative">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Cliente</label>
                <div className="relative">
                  <input placeholder="Nombre del cliente" value={pedidoForm.cliente_nombre}
                    onChange={e => setPedidoForm(f => ({ ...f, cliente_nombre: e.target.value }))}
                    className="input text-sm w-full mt-1" autoFocus />
                  
                  <AnimatePresence>
                    {clienteSearchResults.length > 0 && (
                      <motion.div 
                        initial={{ opacity:0, y:-5 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-5 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto"
                      >
                        {clienteSearchResults.map(c => (
                          <button 
                            key={c.id}
                            onClick={() => {
                              setPedidoForm(f => ({ ...f, cliente_nombre: c.nombre }));
                              setClienteSearchResults([]);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-[#8B5CF6]/10 transition-colors flex items-center justify-between border-b border-zinc-800/50 last:border-0"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white">{c.nombre}</span>
                              <span className="text-[10px] text-zinc-500">{c.email || c.telefono || 'Sin contacto'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {c.visitas > 0 && <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded uppercase font-black">{c.visitas} vis.</span>}
                              <ChevronRight size={12} className="text-zinc-600" />
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {isSearchingClientes && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
                      <div className="w-3 h-3 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>
              <div className="w-28">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Mesa</label>
                <input placeholder="N° mesa" value={pedidoForm.mesa}
                  onChange={e => setPedidoForm(f => ({ ...f, mesa: e.target.value }))}
                  className="input text-sm w-full mt-1" />
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden min-h-0">
              <div className="flex-1 flex flex-col overflow-hidden border-r border-zinc-800">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <input placeholder="Buscar producto..." value={pedidoSearch}
                    onChange={e => setPedidoSearch(e.target.value)}
                    className="input text-sm w-full" />
                </div>
                <div className="flex gap-1 px-4 py-2 overflow-x-auto border-b border-zinc-800 scrollbar-none">
                  {cats.map(c => (
                    <button key={c} onClick={() => setPedidoCatFilter(c)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${pedidoCatFilter === c ? 'bg-[#8B5CF6] text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                      {c}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 content-start">
                  {productosLoading ? (
                    <div className="col-span-3 flex flex-col items-center justify-center py-10 gap-3">
                      <div className="w-7 h-7 rounded-full border-2 border-[#8B5CF6]/30 border-t-[#8B5CF6] animate-spin" />
                      <p className="text-zinc-600 text-xs">Cargando catálogo...</p>
                    </div>
                  ) : prodsFiltrados.length === 0 ? (
                    <div className="col-span-3 flex flex-col items-center justify-center py-10 gap-2 text-center">
                      <ShoppingCart size={28} className="text-zinc-700 mb-1" />
                      <p className="text-zinc-500 text-sm font-semibold">Sin productos</p>
                      <p className="text-zinc-600 text-xs">Agrega productos desde <span className="text-[#8B5CF6] font-bold">Configuración → Menú</span></p>
                      <button onClick={() => loadProductos()} className="mt-2 text-xs text-zinc-500 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg transition-colors">
                        Reintentar
                      </button>
                    </div>
                  ) : prodsFiltrados.map(prod => {
                    const enCarrito = pedidoItems.find(i => i.producto_id === prod.id);
                    return (
                      <button key={prod.id} onClick={() => addItem(prod)}
                        className={`relative flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${enCarrito ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'}`}>
                        {enCarrito && (
                          <span className="absolute top-2 right-2 bg-[#8B5CF6] text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                            {enCarrito.cantidad}
                          </span>
                        )}
                        <span className="text-white text-xs font-bold leading-tight pr-6">{prod.nombre}</span>
                        <span className="text-zinc-500 text-[10px]">{prod.categoria}</span>
                        <span className="text-amber-400 font-black text-sm mt-1">${Number(prod.precio).toLocaleString('es-CL')}</span>
                        {prod.stock <= 5 && (
                          <span className="text-[10px] text-red-400">Stock: {prod.stock}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-64 flex flex-col">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pedido ({pedidoItems.length} items)</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                  {pedidoItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
                      <ShoppingCart size={28} />
                      <p className="text-xs text-center">Selecciona productos del catálogo</p>
                    </div>
                  ) : pedidoItems.map(item => (
                    <div key={item.producto_id} className="bg-zinc-900 rounded-xl p-2.5 flex flex-col gap-1.5">
                      <p className="text-white text-xs font-semibold leading-tight">{item.nombre}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => changeQty(item.producto_id, -1)}
                            className="w-6 h-6 rounded-lg bg-zinc-800 text-white text-sm font-bold flex items-center justify-center hover:bg-zinc-700">−</button>
                          <span className="text-white font-bold text-sm w-5 text-center">{item.cantidad}</span>
                          <button onClick={() => changeQty(item.producto_id, +1)}
                            className="w-6 h-6 rounded-lg bg-zinc-800 text-white text-sm font-bold flex items-center justify-center hover:bg-zinc-700">+</button>
                        </div>
                        <span className="text-amber-400 text-xs font-bold">${Number(item.precio_unitario * item.cantidad).toLocaleString('es-CL')}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-zinc-800 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm font-bold">Total</span>
                    <span className="text-amber-400 font-black text-xl">${Number(totalPedido).toLocaleString('es-CL', { minimumFractionDigits:2 })}</span>
                  </div>
                  {pedidoError && (
                    <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#EF4444', display:'flex', gap:'8px', alignItems:'center' }}>
                      <span>⚠</span> {pedidoError}
                    </div>
                  )}
                  <button onClick={() => { setPedidoModal(false); setPedidoError(null); }}
                    className="py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white transition-colors text-sm font-semibold">
                    Cancelar
                  </button>
                  <button
                    disabled={pedidoLoading || !pedidoForm.cliente_nombre || pedidoItems.length === 0}
                    onClick={handleCreatePedido}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-3 font-bold text-sm">
                    {pedidoLoading ? 'Creando...' : 'Crear pedido'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
