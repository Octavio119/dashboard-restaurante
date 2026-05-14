import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RippleButton } from '../components/ui/ripple';
import { SkeletonTable, SkeletonRow } from '../components/ui/Skeleton';
import ImportProductosModal from '../components/modals/ImportProductosModal';
import {
  Package, List, Truck, Download, Upload, History, Plus,
  AlertTriangle, AlertCircle, RefreshCw, X, Pencil, Trash2, Users, Smartphone, Mail
} from 'lucide-react';

// Shimmer border + pulse animations injected once
const INVENTARIO_STYLES = `
  @keyframes shimmer-red {
    0%, 100% { border-left-color: rgba(239,68,68,0.9); }
    50%       { border-left-color: rgba(239,68,68,0.15); }
  }
  @keyframes shimmer-amber {
    0%, 100% { border-left-color: rgba(245,158,11,0.85); }
    50%       { border-left-color: rgba(245,158,11,0.12); }
  }
  @keyframes pulse-count {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.7; transform: scale(0.95); }
  }
  .inv-row-agotado {
    border-left: 3px solid rgba(239,68,68,0.9);
    animation: shimmer-red 1.8s ease-in-out infinite;
    background: rgba(239,68,68,0.03) !important;
  }
  .inv-row-bajo {
    border-left: 3px solid rgba(245,158,11,0.85);
    animation: shimmer-amber 2.2s ease-in-out infinite;
    background: rgba(245,158,11,0.02) !important;
  }
  .inv-row-normal { border-left: 3px solid transparent; }
  .inv-pulse { animation: pulse-count 2s ease-in-out infinite; display: inline-block; }
`;

export default function InventarioPage({
  inventarioTab, setInventarioTab,
  exportInventarioExcel, productos,
  productosLoading, loadProductos,
  setMovimientoForm, setIsMovModalOpen,
  proveedores,
  movStats,
  movFiltros, setMovFiltros,
  invLoading,
  movimientos, movTotal,
  setProveedorForm, setIsProvModalOpen,
  deleteProveedor
}) {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
    <motion.div key="inventario" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="p-4 sm:p-8 flex flex-col gap-6 max-w-[1200px] w-full mx-auto">
      <style>{INVENTARIO_STYLES}</style>
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Gestión de <span style={{ color: 'var(--primary)' }}>Inventario</span></h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Control de suministros, trazabilidad y proveedores</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#0D0D0F', border: '1px solid #1F1F23' }}>
            {[
              { id: 'stock', label: 'Stock', icon: Package },
              { id: 'movimientos', label: 'Movimientos', icon: List },
              { id: 'proveedores', label: 'Proveedores', icon: Truck },
            ].map(t => (
              <button key={t.id} onClick={() => setInventarioTab(t.id)}
                className="flex items-center gap-1.5 rounded-lg transition-all"
                style={{
                  height: '38px',
                  padding: '0 18px',
                  fontSize: '13px',
                  ...(inventarioTab === t.id
                    ? { background: '#18181B', border: '1px solid #3F3F46', color: '#F4F4F5' }
                    : { background: 'transparent', border: '1px solid transparent', color: '#71717A' }
                  )
                }}
                onMouseEnter={e => { if (inventarioTab !== t.id) { e.currentTarget.style.color = '#A1A1AA'; e.currentTarget.style.background = '#111113'; } }}
                onMouseLeave={e => { if (inventarioTab !== t.id) { e.currentTarget.style.color = '#71717A'; e.currentTarget.style.background = 'transparent'; } }}
              >
                <t.icon size={13} /> {t.label}
              </button>
            ))}
          </div>
          <button onClick={() => exportInventarioExcel(productos)} disabled={!productos.length}
            className="flex items-center gap-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ height: '38px', padding: '0 16px', fontSize: '13px', border: '1px solid #27272A', color: '#A1A1AA', background: 'transparent' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.borderColor = '#16A34A'; e.currentTarget.style.color = '#4ADE80'; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#27272A'; e.currentTarget.style.color = '#A1A1AA'; }}
          >
            <Download size={14}/> Excel
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 rounded-lg transition-all cursor-pointer"
            style={{ height: '38px', padding: '0 16px', fontSize: '13px', border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA', background: 'rgba(139,92,246,0.07)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.color = '#C4B5FD'; e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; e.currentTarget.style.color = '#A78BFA'; e.currentTarget.style.background = 'rgba(139,92,246,0.07)'; }}
          >
            <Upload size={14}/> Importar
          </button>
          <RippleButton
            onClick={() => { setMovimientoForm({ producto_id:'', tipo:'entrada', cantidad:'', proveedor_id:'', notas:'' }); setIsMovModalOpen(true); }}
            className="btn-primary flex items-center gap-2"
            style={{ height: '38px', padding: '0 18px', fontSize: '13px', fontWeight: 500 }}
          >
            <History size={15}/> Registrar movimiento
          </RippleButton>
        </div>
      </div>

      {/* Vistas de Inventario */}
      {inventarioTab === 'stock' && (
        <div className="flex flex-col gap-6">
          {/* Alertas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: 'STOCK CRÍTICO',
                value: productos.filter(p => p.stock <= p.stock_minimo).length,
                Icon: AlertTriangle,
                suffix: 'productos',
                pulse: true,
                cardStyle: { background: '#1A0707', border: '1px solid #DC2626', borderTop: '2px solid #DC2626', boxShadow: '0 0 20px #DC262610' },
                iconBg: 'rgba(220,38,38,0.12)', iconColor: '#F87171', numColor: '#F87171',
              },
              {
                label: 'AGOTÁNDOSE',
                value: productos.filter(p => p.stock > p.stock_minimo && p.stock <= p.stock_minimo * 1.5).length,
                Icon: AlertCircle,
                suffix: 'productos',
                pulse: false,
                cardStyle: { background: '#1C1007', border: '1px solid #D97706', borderTop: '2px solid #D97706', boxShadow: '0 0 20px #D9770610' },
                iconBg: 'rgba(217,119,6,0.12)', iconColor: '#FCD34D', numColor: '#FCD34D',
              },
              {
                label: 'PROVEEDORES ACTIVOS',
                value: proveedores.length,
                Icon: Truck,
                suffix: 'registrados',
                pulse: false,
                cardStyle: { background: '#050E1F', border: '1px solid #2563EB', borderTop: '2px solid #2563EB', boxShadow: '0 0 20px #2563EB10' },
                iconBg: 'rgba(37,99,235,0.12)', iconColor: '#60A5FA', numColor: '#3F3F46',
              },
            ].map((s, i) => (
              <div key={i} className="metric-card flex flex-col gap-4 cursor-default" style={s.cardStyle}>
                <div className="metric-icon" style={{ background: s.iconBg }}>
                  <s.Icon size={17} style={{ color: s.iconColor }} />
                </div>
                <div>
                  <p className="metric-label" style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#71717A' }}>{s.label}</p>
                  <h3 className="metric-value" style={{ color: s.numColor }}>
                    <span className={s.pulse && s.value > 0 ? 'inv-pulse' : ''} style={{ fontSize: '36px', fontWeight: 500 }}>{s.value}</span>
                    {' '}<span style={{ fontSize: '13px', fontWeight: 500, color: '#52525B' }}>{s.suffix}</span>
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid #1F1F23', background: 'var(--bg-surface)' }}>
                  {['Producto','Categoría','Stock Actual','Mínimo','Unidad','Estado'].map(h=>(
                    <th key={h} className="px-6 pt-4" style={{ fontSize: '11px', fontWeight: 500, color: '#3F3F46', letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: '10px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productosLoading
                  ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                  : productos.map(p => {
                  const rowClass = p.stock <= 0
                    ? 'inv-row-agotado'
                    : p.stock <= p.stock_minimo
                      ? 'inv-row-bajo'
                      : 'inv-row-normal';
                  const stockColor = p.stock <= 0 || p.stock <= p.stock_minimo
                    ? '#F87171'
                    : p.stock <= p.stock_minimo * 1.5
                      ? '#FCD34D'
                      : '#4ADE80';
                  return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${rowClass}`}
                    style={{ borderBottom: '1px solid #131316' }}
                    onMouseEnter={e => { if (!e.currentTarget.classList.contains('inv-row-agotado') && !e.currentTarget.classList.contains('inv-row-bajo')) e.currentTarget.style.background = '#111113'; }}
                    onMouseLeave={e => { if (!e.currentTarget.classList.contains('inv-row-agotado') && !e.currentTarget.classList.contains('inv-row-bajo')) e.currentTarget.style.background = ''; }}
                  >
                    <td className="px-6 py-4">
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#F4F4F5', display: 'block' }}>{p.nombre}</span>
                      <span style={{ fontSize: '11px', color: '#3F3F46', fontFamily: 'monospace' }}>Id: {p.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize" style={{ background: '#1C1C1F', border: '1px solid #27272A', borderRadius: '4px', padding: '3px 10px', fontSize: '12px', color: '#A1A1AA' }}>{p.categoria}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span style={{ fontSize: '15px', fontWeight: 500, color: stockColor }}>{p.stock}</span>
                    </td>
                    <td className="px-6 py-4" style={{ fontSize: '13px', color: '#52525B' }}>{p.stock_minimo}</td>
                    <td className="px-6 py-4" style={{ fontSize: '13px', color: '#52525B' }}>{p.unidad || 'und'}</td>
                    <td className="px-6 py-4">
                      {p.stock <= 0 ? (
                        <span style={{ background: '#1A0707', border: '1px solid #DC2626', borderRadius: '4px', padding: '3px 10px', fontSize: '12px', color: '#F87171', fontWeight: 500 }}>Agotado</span>
                      ) : p.stock <= p.stock_minimo ? (
                        <span style={{ background: '#1C1007', border: '1px solid #D97706', borderRadius: '4px', padding: '3px 10px', fontSize: '12px', color: '#FCD34D', fontWeight: 500 }}>Bajo Stock</span>
                      ) : (
                        <span style={{ background: '#052912', border: '1px solid #16A34A', borderRadius: '4px', padding: '3px 10px', fontSize: '12px', color: '#4ADE80', fontWeight: 500 }}>Disponible</span>
                      )}
                    </td>
                  </tr>
                  );
                })}
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
              <div key={tipo} className="metric-card flex flex-col gap-4 cursor-default"
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
              <SkeletonTable rows={6} cols={8} className="p-4" />
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
            <button onClick={() => { setProveedorForm({ nombre:'', contacto:'', email:'', telefono:'', direccion:'', notas:'' }); setIsProvModalOpen(true); }} className="btn-ghost flex items-center gap-2">
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

    <AnimatePresence>
      {importOpen && (
        <ImportProductosModal
          onClose={() => setImportOpen(false)}
          onSuccess={() => { loadProductos?.(); }}
        />
      )}
    </AnimatePresence>
    </>
  );
}
