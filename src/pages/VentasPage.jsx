import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Download, Plus, Wallet, X, Receipt, 
  Banknote, CreditCard, Smartphone, QrCode, Trash2, Printer, Check 
} from 'lucide-react';

export default function VentasPage({
  ventasFecha, setVentasFecha,
  ventasDia, exportReportePDF, exportVentasExcel,
  setVentaItems, setVentaMetodo, setVentaTicket, setVentaProductos, setVentaModal,
  api, cajaHoy, setCajaMonto, setCajaModal, cajaModal, cajaLoading, setCajaLoading, setCajaHoy,
  ventasResumen, downloadPDF, printTicket, isAdmin, deleteVenta,
  loadVentasDia, loadVentas,
  ventaItems, ventaProductos, ventaMetodo, config, ventaLoading, ventaTicket, ventaModal
}) {
  return (
    <motion.div key="ventas" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="p-8 flex flex-col gap-6 max-w-[1200px] w-full mx-auto">

      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Caja & <span className="text-amber-500">Ventas</span></h2>
          <p className="text-zinc-500 text-sm mt-1">Registro de ventas del día</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={ventasFecha}
            onChange={e => setVentasFecha(e.target.value)}
            className="input text-sm"
          />
          <button onClick={() => exportReportePDF(ventasDia, ventasFecha)} disabled={!ventasDia.length}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <FileText size={14}/> PDF
          </button>
          <button onClick={() => exportVentasExcel(ventasDia, ventasFecha)} disabled={!ventasDia.length}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Download size={14}/> Excel
          </button>
          <button
            onClick={async () => {
              setVentaItems([{ nombre:'', qty:1, precio_unit:'', producto_id: null }]);
              setVentaMetodo('efectivo');
              setVentaTicket(null);
              setVentaProductos([]);
              try {
                const prods = await api.getProductos();
                setVentaProductos(prods);
              } catch { setVentaProductos([]); }
              setVentaModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15}/> Nueva venta
          </button>
        </div>
      </div>

      {/* ── Banner Caja Diaria ── */}
      {cajaHoy === null ? (
        <div className="card p-5 flex items-center justify-between gap-4 border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400"><Wallet size={20}/></div>
            <div>
              <p className="font-bold text-white text-sm">Caja no abierta</p>
              <p className="text-zinc-500 text-xs">Abre la caja para comenzar a registrar ventas del día</p>
            </div>
          </div>
          <button onClick={() => { setCajaMonto(''); setCajaModal('abrir'); }}
            className="btn-primary flex items-center gap-2 shrink-0">
            <Plus size={15}/> Abrir caja
          </button>
        </div>
      ) : cajaHoy.estado === 'abierta' ? (
        <div className="card p-5 flex items-center justify-between gap-4 border-green-500/20">
          <div className="flex items-center gap-4 flex-wrap gap-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400"><Wallet size={20}/></div>
              <div>
                <p className="font-bold text-white text-sm">Caja abierta</p>
                <p className="text-zinc-500 text-xs">Abierta por {cajaHoy.cajero_apertura}</p>
              </div>
            </div>
            <div className="pl-4 border-l border-zinc-700">
              <p className="text-zinc-500 text-xs">Monto inicial</p>
              <p className="font-black text-amber-400">${Number(cajaHoy.monto_inicial).toFixed(2)}</p>
            </div>
          </div>
          <button onClick={() => { setCajaMonto(''); setCajaModal('cerrar'); }}
            className="flex items-center gap-2 shrink-0 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-bold">
            <X size={15}/> Cerrar caja
          </button>
        </div>
      ) : (
        <div className="card p-5 flex items-center justify-between gap-4 border-zinc-700">
          <div className="flex items-center gap-4 flex-wrap gap-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-zinc-700 text-zinc-400"><Wallet size={20}/></div>
              <div>
                <p className="font-bold text-zinc-300 text-sm">Caja cerrada</p>
                <p className="text-zinc-500 text-xs">Cerrada por {cajaHoy.cajero_cierre}</p>
              </div>
            </div>
            <div className="pl-4 border-l border-zinc-700">
              <p className="text-zinc-500 text-xs">Total ventas</p>
              <p className="font-black text-white">${Number(cajaHoy.total_ventas).toFixed(2)}</p>
            </div>
            <div className="pl-4 border-l border-zinc-700">
              <p className="text-zinc-500 text-xs">Monto contado</p>
              <p className="font-black text-white">${Number(cajaHoy.monto_final).toFixed(2)}</p>
            </div>
            <div className="pl-4 border-l border-zinc-700">
              <p className="text-zinc-500 text-xs">Diferencia</p>
              <p className={`font-black ${cajaHoy.diferencia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {cajaHoy.diferencia >= 0 ? '+' : ''}{Number(cajaHoy.diferencia).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Métricas del día */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Ventas hoy</p>
          <h3 className="text-2xl font-black text-white">{ventasResumen.cantidad}</h3>
        </div>
        <div className="card p-5">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Total hoy</p>
          <h3 className="text-2xl font-black text-amber-400">${ventasResumen.total.toFixed(2)}</h3>
        </div>
        {Object.entries(ventasResumen.por_metodo || {}).map(([m, v]) => (
          <div key={m} className="card p-5">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">{m}</p>
            <h3 className="text-2xl font-black text-white">${Number(v).toFixed(2)}</h3>
          </div>
        ))}
      </div>

      {/* Tabla de ventas */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h3 className="font-bold text-white">Ventas del {ventasFecha}</h3>
        </div>
        {ventasDia.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase">
                <th className="px-6 py-3 text-left font-semibold">Ticket</th>
                <th className="px-6 py-3 text-left font-semibold">Items</th>
                <th className="px-6 py-3 text-left font-semibold">Método</th>
                <th className="px-6 py-3 text-left font-semibold">Cajero</th>
                <th className="px-6 py-3 text-right font-semibold">Total</th>
                <th className="px-6 py-3"/>
              </tr>
            </thead>
            <tbody>
              {ventasDia.map(v => (
                <tr key={v.id} className="border-b border-zinc-800/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-mono text-amber-400 font-bold text-xs">{v.ticket_id}</td>
                  <td className="px-6 py-4 text-zinc-300">
                    {v.items.map((it, i) => (
                      <span key={i} className="inline-block mr-2 text-xs bg-zinc-800 rounded px-2 py-0.5">
                        {it.nombre} ×{it.qty}
                      </span>
                    ))}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border border-zinc-700 text-zinc-300 bg-zinc-800">
                      {v.metodo_pago}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-xs">{v.cajero}</td>
                  <td className="px-6 py-4 text-right font-black text-white">${v.total.toFixed(2)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => downloadPDF(v)}
                        className="text-zinc-500 hover:text-amber-400 transition-colors"
                        title="Descargar PDF"
                      >
                        <Download size={14}/>
                      </button>
                      <button
                        onClick={() => printTicket(v)}
                        className="text-zinc-500 hover:text-amber-400 transition-colors"
                        title="Imprimir ticket"
                      >
                        <Printer size={14}/>
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => deleteVenta(v)}
                          className="text-zinc-600 hover:text-red-400 transition-colors"
                          title="Anular venta"
                        >
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
            <Receipt size={40} className="mb-3 opacity-30"/>
            <p className="font-semibold">Sin ventas para esta fecha</p>
          </div>
        )}
      </div>

      {/* ── Modal Caja ── */}
      {cajaModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setCajaModal(null)} />
          <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-5">

            {cajaModal === 'abrir' ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400"><Wallet size={20}/></div>
                  <h3 className="font-black text-white text-lg">Abrir caja</h3>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Monto inicial en caja</label>
                  <input
                    type="number" min="0" step="0.01" placeholder="0.00"
                    value={cajaMonto}
                    onChange={e => setCajaMonto(e.target.value)}
                    className="input text-lg font-bold"
                    autoFocus
                  />
                  <p className="text-zinc-600 text-xs">Dinero físico con el que inicia el turno</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCajaModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white transition-colors text-sm font-semibold">
                    Cancelar
                  </button>
                  <button
                    disabled={cajaLoading || cajaMonto === '' || isNaN(parseFloat(cajaMonto))}
                    onClick={async () => {
                      setCajaLoading(true);
                      try {
                        const c = await api.abrirCaja(parseFloat(cajaMonto));
                        setCajaHoy(c);
                        setCajaModal(null);
                      } catch(e) { alert(e.message); }
                      finally { setCajaLoading(false); }
                    }}
                    className="btn-primary flex-1 disabled:opacity-50">
                    {cajaLoading ? 'Abriendo...' : 'Abrir caja'}
                  </button>
                </div>
              </>
            ) : (
              /* cerrar */
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400"><Wallet size={20}/></div>
                  <h3 className="font-black text-white text-lg">Cerrar caja</h3>
                </div>

                {/* Resumen */}
                <div className="bg-zinc-800 rounded-xl p-4 flex flex-col gap-3 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>Monto inicial</span>
                    <span className="font-bold text-white">${cajaHoy ? Number(cajaHoy.monto_inicial).toFixed(2) : '—'}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Total ventas del día</span>
                    <span className="font-bold text-white">${ventasResumen.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Ventas en efectivo</span>
                    <span className="font-bold text-white">${Number(ventasResumen.por_metodo?.efectivo || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-700 pt-2 text-zinc-400">
                    <span>Esperado en caja</span>
                    <span className="font-bold text-amber-400">
                      ${(Number(cajaHoy?.monto_inicial || 0) + Number(ventasResumen.por_metodo?.efectivo || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Monto contado en caja</label>
                  <input
                    type="number" min="0" step="0.01" placeholder="0.00"
                    value={cajaMonto}
                    onChange={e => setCajaMonto(e.target.value)}
                    className="input text-lg font-bold"
                    autoFocus
                  />
                  {cajaMonto !== '' && !isNaN(parseFloat(cajaMonto)) && cajaHoy && (() => {
                    const esperado  = Number(cajaHoy.monto_inicial) + Number(ventasResumen.por_metodo?.efectivo || 0);
                    const diferencia = parseFloat(cajaMonto) - esperado;
                    return (
                      <p className={`text-sm font-bold ${diferencia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        Diferencia: {diferencia >= 0 ? '+' : ''}{diferencia.toFixed(2)}
                      </p>
                    );
                  })()}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setCajaModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white transition-colors text-sm font-semibold">
                    Cancelar
                  </button>
                  <button
                    disabled={cajaLoading || cajaMonto === '' || isNaN(parseFloat(cajaMonto))}
                    onClick={async () => {
                      setCajaLoading(true);
                      try {
                        const c = await api.cerrarCaja(parseFloat(cajaMonto));
                        setCajaHoy(c);
                        setCajaModal(null);
                      } catch(e) { alert(e.message); }
                      finally { setCajaLoading(false); }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-bold disabled:opacity-50">
                    {cajaLoading ? 'Cerrando...' : 'Cerrar caja'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Modal nueva venta */}
      {ventaModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setVentaModal(false); setVentaTicket(null); setVentaItems([{ nombre:'', qty:1, precio_unit:'', producto_id: null }]); }} />
          <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg flex flex-col gap-5 max-h-[90vh] overflow-y-auto">

            {ventaTicket ? (
              /* ── Boleta estructurada ── */
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400"><Check size={20}/></div>
                  <div>
                    <h3 className="font-black text-white text-lg">Venta registrada</h3>
                    <p className="text-zinc-400 text-sm font-mono">{ventaTicket.ticket_id}</p>
                  </div>
                </div>

                <div className="bg-zinc-800 rounded-xl p-5 font-mono text-sm flex flex-col gap-0">
                  {/* Cabecera negocio */}
                  <div className="flex flex-col items-center gap-1 pb-3 border-b border-zinc-700 mb-3">
                    {ventaTicket.logo_url && (
                      <img src={ventaTicket.logo_url} alt="logo" className="h-10 object-contain mb-1"/>
                    )}
                    <p className="font-black text-white text-base tracking-wide">{ventaTicket.restaurante}</p>
                    {ventaTicket.rut && <p className="text-zinc-500 text-xs">RUT: {ventaTicket.rut}</p>}
                    {ventaTicket.direccion && <p className="text-zinc-500 text-xs">{ventaTicket.direccion}</p>}
                  </div>

                  {/* Fecha y hora */}
                  <div className="flex justify-between text-zinc-400 text-xs pb-3 border-b border-zinc-700 mb-3">
                    <span>{ventaTicket.fecha}</span><span>{ventaTicket.hora}</span>
                  </div>

                  {/* Items */}
                  <div className="flex flex-col gap-1.5 pb-3 border-b border-zinc-700 mb-3">
                    {ventaTicket.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-zinc-300">
                        <span className="truncate max-w-[180px]">{it.nombre} ×{it.qty}</span>
                        <span>${(it.precio_unit * it.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Totales */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-zinc-400 text-xs">
                      <span>Subtotal</span><span>${ventaTicket.subtotal.toFixed(2)}</span>
                    </div>
                    {ventaTicket.impuesto_activo && (
                      <div className="flex justify-between text-zinc-500 text-xs">
                        <span>IVA ({ventaTicket.tax_rate}%)</span><span>${ventaTicket.tax_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-white border-t border-zinc-600 mt-1 pt-2">
                      <span>TOTAL</span><span className="text-amber-400">${ventaTicket.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-zinc-600 text-[10px] flex justify-between mt-3 pt-2 border-t border-zinc-700">
                    <span>Pago: {ventaTicket.metodo_pago}</span>
                    <span>Cajero: {ventaTicket.cajero}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => downloadPDF(ventaTicket)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:border-amber-500/40 hover:text-amber-400 transition-colors text-sm font-semibold"
                  >
                    <Download size={15}/> PDF
                  </button>
                  <button
                    onClick={() => printTicket(ventaTicket)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:border-amber-500/40 hover:text-amber-400 transition-colors text-sm font-semibold"
                  >
                    <Printer size={15}/> Imprimir
                  </button>
                  <button className="btn-primary flex-1" onClick={() => { setVentaModal(false); setVentaTicket(null); setVentaItems([{ nombre:'', qty:1, precio_unit:'', producto_id: null }]); loadVentasDia(); loadVentas(); }}>
                    Cerrar
                  </button>
                </div>
              </>
            ) : (
              /* ── Formulario ── */
              <>
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-white text-lg">Nueva Venta</h3>
                  <button onClick={() => { setVentaModal(false); setVentaTicket(null); setVentaItems([{ nombre:'', qty:1, precio_unit:'', producto_id: null }]); }} className="text-zinc-500 hover:text-white"><X size={18}/></button>
                </div>

                {/* Items */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Items</label>
                  {ventaItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_60px_80px_32px] gap-2 items-center">
                      {ventaProductos.length > 0 ? (
                        <select
                          value={item.producto_id ?? ''}
                          onChange={e => {
                            const prod = ventaProductos.find(p => p.id === parseInt(e.target.value));
                            setVentaItems(v => v.map((x,i) => i===idx ? {
                              ...x,
                              producto_id: prod ? prod.id : null,
                              nombre:      prod ? prod.nombre : '',
                              precio_unit: prod ? prod.precio : x.precio_unit,
                            } : x));
                          }}
                          className="input text-sm bg-zinc-800"
                        >
                          <option value="">— Seleccionar producto —</option>
                          {ventaProductos.map(p => (
                            <option key={p.id} value={p.id} disabled={p.stock === 0}>
                              {p.nombre} {p.stock === 0 ? '(sin stock)' : `(stock: ${p.stock})`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          placeholder="Descripción"
                          value={item.nombre}
                          onChange={e => setVentaItems(v => v.map((x,i) => i===idx ? {...x, nombre:e.target.value, producto_id: null} : x))}
                          className="input text-sm"
                        />
                      )}
                      <input
                        type="number" min="1" placeholder="Cant"
                        value={item.qty}
                        onChange={e => setVentaItems(v => v.map((x,i) => i===idx ? {...x, qty:parseInt(e.target.value)||1} : x))}
                        className="input text-sm text-center"
                      />
                      <input
                        type="number" min="0" step="0.01" placeholder="Precio"
                        value={item.precio_unit}
                        onChange={e => setVentaItems(v => v.map((x,i) => i===idx ? {...x, precio_unit:e.target.value} : x))}
                        className="input text-sm"
                      />
                      <button onClick={() => setVentaItems(v => v.filter((_,i) => i!==idx))}
                        className="text-zinc-600 hover:text-red-400 transition-colors" disabled={ventaItems.length===1}>
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setVentaItems(v => [...v, { nombre:'', qty:1, precio_unit:'', producto_id: null }])}
                    className="text-amber-500 text-xs font-bold hover:text-amber-400 flex items-center gap-1 w-fit mt-1">
                    <Plus size={12}/> Agregar item
                  </button>
                </div>

                {/* Método de pago */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Método de pago</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value:'efectivo',     label:'Efectivo',      icon:Banknote },
                      { value:'tarjeta',      label:'Tarjeta',       icon:CreditCard },
                      { value:'transferencia',label:'Transferencia', icon:Smartphone },
                      { value:'qr',           label:'QR',            icon:QrCode },
                    ].map(({ value, label, icon:Icon }) => (
                      <button key={value} onClick={() => setVentaMetodo(value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${ventaMetodo===value ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white'}`}>
                        <Icon size={18}/>
                        <span className="text-[10px] font-bold">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total calculado con IVA */}
                {(() => {
                  const subtotal  = ventaItems.reduce((s,i) => s + (parseFloat(i.precio_unit)||0) * (i.qty||1), 0);
                  const taxAmount = config.impuestoActivo ? subtotal * config.taxRate / 100 : 0;
                  const total     = subtotal + taxAmount;
                  return (
                    <div className="bg-zinc-800 rounded-xl px-5 py-4 flex flex-col gap-2">
                      <div className="flex justify-between text-zinc-400 text-sm">
                        <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                      </div>
                      {config.impuestoActivo && (
                        <div className="flex justify-between text-zinc-500 text-sm">
                          <span>IVA ({config.taxRate}%)</span><span>${taxAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-t border-zinc-700 pt-2 mt-1">
                        <span className="text-zinc-400 font-semibold text-sm">Total</span>
                        <span className="text-2xl font-black text-amber-400">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}

                <button
                  disabled={ventaLoading || ventaItems.every(i => !i.nombre)}
                  onClick={async () => {
                    const validItems = ventaItems.filter(i => i.nombre && parseFloat(i.precio_unit) > 0);
                    if (validItems.length === 0) return;
                    const total = validItems.reduce((s,i) => s + parseFloat(i.precio_unit) * i.qty, 0);
                    setVentaLoading(true);
                    try {
                      const ticket = await api.createVenta({
                        items: validItems.map(i => ({ ...i, precio_unit: parseFloat(i.precio_unit), qty: parseInt(i.qty) })),
                        total,
                        metodo_pago: ventaMetodo,
                      });
                      setVentaTicket(ticket);
                    } catch(e) { alert(e.message); }
                    finally { setVentaLoading(false); }
                  }}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50"
                >
                  <Receipt size={16}/>
                  {ventaLoading ? 'Registrando...' : 'Registrar venta'}
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}
