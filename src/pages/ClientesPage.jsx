import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Building2, FileText, Trash2 } from 'lucide-react';

export default function ClientesPage({
  filteredClientes,
  setClienteForm,
  setClienteFormOpen,
  setSelectedCustomer,
  isAdmin,
  deleteCliente
}) {
  return (
    <motion.div key="clientes" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="p-8 flex flex-col gap-6 max-w-[1400px] w-full mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Módulo de <span className="text-amber-500">Clientes</span></h2>
          <p className="text-zinc-500 text-sm mt-1">Gestión de relaciones y fidelización</p>
        </div>
        <button
          onClick={() => { setClienteForm({ nombre:'', email:'', telefono:'', rut:'', tipo_cliente:'persona', razon_social:'', estado:'Nuevo' }); setClienteFormOpen(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15}/> Nuevo Cliente
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              {['Cliente','RUT / Tipo','Contacto','Visitas','Total Gastado','Estado','Acciones'].map(h => (
                <th key={h} className="px-5 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredClientes.map(c => (
              <tr key={c.id} className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-black text-sm">
                      {c.nombre.charAt(0)}
                    </div>
                    <span className="font-semibold text-white text-sm">{c.nombre}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm text-zinc-300 font-mono">{c.rut || '—'}</p>
                  <span className={`text-[10px] font-bold uppercase ${c.tipo_cliente==='empresa' ? 'text-blue-400' : 'text-zinc-500'}`}>
                    {c.tipo_cliente==='empresa' ? <span className="flex items-center gap-1"><Building2 size={10}/>Empresa</span> : 'Persona'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm text-zinc-300">{c.email || '—'}</p>
                  <p className="text-[11px] text-zinc-500">{c.telefono || ''}</p>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-md text-xs font-bold">{c.visitas}</span>
                </td>
                <td className="px-5 py-4 font-black text-white">${Number(c.total_gastado).toFixed(2)}</td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase border ${
                    c.estado==='VIP' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    c.estado==='Regular' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-zinc-700 text-zinc-400 border-zinc-600'
                  }`}>{c.estado}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-bold hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-colors"
                    >
                      Historial
                    </button>
                    <button
                      onClick={() => { setClienteForm({...c}); setClienteFormOpen(true); }}
                      className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
                    >
                      <FileText size={14}/>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => deleteCliente(c)}
                        className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
                        title="Eliminar cliente"
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
        {filteredClientes.length === 0 && (
          <div className="py-14 flex flex-col items-center text-zinc-600">
            <Users size={36} className="mb-2 opacity-30" />
            <p className="text-sm">Sin clientes registrados</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
