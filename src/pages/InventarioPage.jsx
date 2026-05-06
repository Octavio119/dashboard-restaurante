import React from 'react';
import { motion } from 'framer-motion';
import { 
  Package, List, Truck, Download, History, Plus,
  AlertTriangle, AlertCircle, RefreshCw, X, Pencil, Trash2, Users, Smartphone, Mail
} from 'lucide-react';

export default function InventarioPage({
  inventarioTab, setInventarioTab,
  exportInventarioExcel, productos,
  setMovimientoForm, setIsMovModalOpen,
  proveedores,
  movStats,
  movFiltros, setMovFiltros,
  invLoading,
  movimientos, movTotal,
  setProveedorForm, setIsProvModalOpen,
  deleteProveedor
}) {
  return (
    <motion.div key="inventario" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="p-4 sm:p-8 flex flex-col gap-6 max-w-[1200px] w-full mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Gestión de <span style={{ color: 'var(--primary)' }}>Inventario</span></h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Control de suministros, trazabilidad y proveedores</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="tab-group">
            {[
              { id: 'stock', label: 'Stock', icon: Package },
              { id: 'movimientos', label: 'Movimientos', icon: List },
              { id: 'proveedores', label: 'Proveedores', icon: Truck },
            ].map(t => (
              <button key={t.id} onClick={() => setInventarioTab(t.id)}
                className={`tab-item flex items-center gap-1.5 ${inventarioTab === t.id ? 'active' : ''}`}>
                <t.icon size={13} /> {t.label}
              </button>
            ))}
          </div>
          <button onClick={() => exportInventarioExcel(productos)} disabled={!productos.length}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Download size={14}/> Excel
          </button>
          <button onClick={() => { setMovimientoForm({ producto_id:'', tipo:'entrada', cantidad:'', proveedor_id:'', notas:'' }); setIsMovModalOpen(true); }} className="btn-primary flex items-center gap-2">
            <History size={15}/> Registrar movimiento
          </button>
        </div>
      </div>

      {/* Vistas de Inventario */}
      {inventarioTab === 'stock' && (
        <div className="flex flex-col gap-6">
          {/* Alertas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Stock Crítico', value: productos.filter(p => p.stock <= p.stock_minimo).length, Icon: AlertTriangle, color: '#EF4444', dimColor: 'var(--red-dim)', suffix: 'productos' },
              { label: 'Agotándose', value: productos.filter(p => p.stock > p.stock_minimo && p.stock <= p.stock_minimo * 1.5).length, Icon: AlertCircle, color: '#F59E0B', dimColor: 'var(--yellow-dim)', suffix: 'productos' },
              { label: 'Proveedores Activos', value: proveedores.length, Icon: Truck, color: '#3B82F6', dimColor: 'var(--blue-dim)', suffix: 'registrados' },
            ].map((s, i) => (
              <div key={i} className="dash-card metric-card flex flex-col gap-4 cursor-default"
                style={{ borderTop: `2px solid ${s.color}`, background: `linear-gradient(135deg, ${s.color}0D 0%, var(--bg-card-2) 60%)` }}>
                <div className="metric-icon" style={{ background: s.dimColor }}>
                  <s.Icon size={17} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="metric-label">{s.label}</p>
                  <h3 className="metric-value" style={{ color: s.color }}>
                    {s.value} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-3)' }}>{s.suffix}</span>
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  {['Producto','Categoría','Stock Actual','Mínimo','Unidad','Estado'].map(h=>(
                    <th key={h} className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productos.map(p => (
                  <tr key={p.id} className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-white block">{p.nombre}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">ID: {p.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-zinc-400 capitalize bg-zinc-800 px-2 py-1 rounded">{p.categoria}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-black ${p.stock <= p.stock_minimo ? 'text-red-400' : 'text-white'}`}>{p.stock}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{p.stock_minimo}</td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{p.unidad || 'und'}</td>
                    <td className="px-6 py-4">
                      {p.stock <= 0 ? (
                        <span className="badge-danger">Agotado</span>
                      ) : p.stock <= p.stock_minimo ? (
                        <span className="badge-warning">Bajo Stock</span>
                      ) : (
                        <span className="badge-success">Disponible</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {inventarioTab === 'movimientos' && (
        <div className="flex flex-col gap-4">
          {/* Stats resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { tipo: 'entrada', label: 'Entradas', color: '#10B981', dimColor: 'var(--teal-dim)',    Icon: Plus,      sign: '+' },
              { tipo: 'salida',  label: 'Salidas',  color: '#EF4444', dimColor: 'var(--red-dim)',     Icon: X,         sign: '-' },
              { tipo: 'ajuste',  label: 'Ajustes',  color: '#F59E0B', dimColor: 'var(--yellow-dim)', Icon: RefreshCw, sign: '±' },
            ].map(({ tipo, label, color, dimColor, Icon, sign }) => (
              <div key={tipo} className="dash-card metric-card flex flex-col gap-4 cursor-default"
                style={{ borderTop: `2px solid ${color}`, background: `linear-gradient(135deg, ${color}0D 0%, var(--bg-card-2) 60%)` }}>
                <div className="metric-icon" style={{ background: dimColor }}>
                  <Icon size={17} style={{ color }} />
                </div>
                <div>
                  <p className="metric-label">{label}</p>
                  <h3 className="metric-value" style={{ color }}>
                    {sign}{movStats[tipo]?.total ?? 0}
                  </h3>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>{movStats[tipo]?.count ?? 0} movimientos</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="card p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tipo</label>
                <select
                  value={movFiltros.tipo}
                  onChange={e => setMovFiltros(f => ({ ...f, tipo: e.target.value }))}
                  className="input bg-zinc-800 text-sm"
                >
                  <option value="">Todos</option>
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                  <option value="ajuste">Ajuste</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Producto</label>
                <select
                  value={movFiltros.producto_id}
                  onChange={e => setMovFiltros(f => ({ ...f, producto_id: e.target.value }))}
                  className="input bg-zinc-800 text-sm"
                >
                  <option value="">Todos</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Desde</label>
                <input
                  type="date"
                  value={movFiltros.fecha_desde}
                  onChange={e => setMovFiltros(f => ({ ...f, fecha_desde: e.target.value }))}
                  className="input bg-zinc-800 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hasta</label>
                <input
                  type="date"
                  value={movFiltros.fecha_hasta}
                  onChange={e => setMovFiltros(f => ({ ...f, fecha_hasta: e.target.value }))}
                  className="input bg-zinc-800 text-sm"
                />
              </div>
            </div>
            {(movFiltros.tipo || movFiltros.producto_id || movFiltros.fecha_desde || movFiltros.fecha_hasta) && (
              <button
                onClick={() => setMovFiltros({ tipo: '', producto_id: '', fecha_desde: '', fecha_hasta: '' })}
                className="mt-3 text-[10px] font-black text-zinc-500 hover:text-amber-400 uppercase tracking-widest transition-colors flex items-center gap-1"
              >
                <X size={11}/> Limpiar filtros
              </button>
            )}
          </div>

          {/* Tabla */}
          <div className="card overflow-hidden">
            {invLoading ? (
              <div className="flex items-center justify-center py-16 text-zinc-500">
                <RefreshCw size={20} className="animate-spin mr-2"/> Cargando movimientos...
              </div>
            ) : movimientos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
                <History size={40} className="mb-3 opacity-30"/>
                <p className="font-bold text-zinc-500">Sin movimientos</p>
                <p className="text-xs mt-1">
                  {movFiltros.tipo || movFiltros.producto_id || movFiltros.fecha_desde || movFiltros.fecha_hasta
                    ? 'No hay resultados para los filtros seleccionados'
                    : 'Registra el primer movimiento de inventario'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                      {['Fecha','Producto','Tipo','Cantidad','Stock','Proveedor','Notas','Usuario'].map(h=>(
                        <th key={h} className="px-4 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map(m => {
                      const [fechaPart, horaPart] = (m.fecha || '').split(' ');
                      const stockNuevo = m.stock_anterior != null
                        ? (m.tipo === 'entrada' ? m.stock_anterior + m.cantidad : Math.max(0, m.stock_anterior - m.cantidad))
                        : null;
                      return (
                        <tr key={m.id} className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs text-zinc-300 block">{fechaPart}</span>
                            {horaPart && <span className="text-[10px] text-zinc-600 font-mono">{horaPart}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-white text-sm">{m.producto_nombre}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${
                              m.tipo === 'entrada' ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                              m.tipo === 'salida'  ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                              'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            }`}>
                              {m.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-black whitespace-nowrap">
                            <span className={m.tipo === 'entrada' ? 'text-green-400' : m.tipo === 'salida' ? 'text-red-400' : 'text-amber-400'}>
                              {m.tipo === 'entrada' ? '+' : '-'}{m.cantidad}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {m.stock_anterior != null ? (
                              <span className="text-xs text-zinc-400 font-mono">
                                {m.stock_anterior} → <span className="text-white font-bold">{stockNuevo}</span>
                              </span>
                            ) : (
                              <span className="text-xs text-zinc-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">{m.proveedor_nombre || <span className="text-zinc-600">—</span>}</td>
                          <td className="px-4 py-3 text-xs text-zinc-500 max-w-[180px] truncate">{m.motivo || <span className="text-zinc-600">—</span>}</td>
                          <td className="px-4 py-3 text-xs text-zinc-400 font-semibold whitespace-nowrap">{m.usuario_nombre}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {movTotal > movimientos.length && (
                  <div className="px-6 py-3 border-t border-zinc-800 text-center">
                    <p className="text-[10px] text-zinc-500">
                      Mostrando {movimientos.length} de {movTotal} movimientos
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {inventarioTab === 'proveedores' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-start">
            <button onClick={() => { setProveedorForm({ nombre:'', contacto:'', email:'', telefono:'', direccion:'', notas:'' }); setIsProvModalOpen(true); }} className="btn-secondary flex items-center gap-2">
               <Plus size={15}/> Nuevo Proveedor
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {proveedores.map(prov => (
              <div key={prov.id} className="card p-5 group hover:border-[#8B5CF6]/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#8B5CF6]">
                    <Truck size={20}/>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setProveedorForm(prov); setIsProvModalOpen(true); }} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><Pencil size={14}/></button>
                    <button onClick={() => deleteProveedor(prov.id)} className="p-1.5 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400"><Trash2 size={14}/></button>
                  </div>
                </div>
                <h3 className="font-black text-lg text-white mb-2">{prov.nombre}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <Users size={14}/> <span>{prov.contacto}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <Smartphone size={14}/> <span>{prov.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <Mail size={14}/> <span>{prov.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
