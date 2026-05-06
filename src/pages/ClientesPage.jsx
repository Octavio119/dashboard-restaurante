import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Building2, FileText, Trash2, Star } from 'lucide-react';

const AVATAR_PALETTES = [
  ['#8B5CF6','#6D28D9'],
  ['#EC4899','#BE185D'],
  ['#06B6D4','#0E7490'],
  ['#10B981','#047857'],
  ['#F59E0B','#B45309'],
  ['#EF4444','#B91C1C'],
  ['#3B82F6','#1D4ED8'],
];

function ClienteAvatar({ nombre }) {
  const idx = (nombre?.charCodeAt(0) ?? 0) % AVATAR_PALETTES.length;
  const [from, to] = AVATAR_PALETTES[idx];
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
      style={{
        background: `linear-gradient(135deg, ${from}, ${to})`,
        boxShadow: `0 0 0 1px ${from}40`,
        fontSize: '13px',
      }}
    >
      {nombre?.charAt(0).toUpperCase()}
    </div>
  );
}

function EstadoBadge({ estado }) {
  if (estado === 'VIP') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
      style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(180,83,9,0.15))', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.3)' }}>
      <Star size={9} fill="currentColor" /> VIP
    </span>
  );
  if (estado === 'Regular') return (
    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
      style={{ background: 'var(--blue-dim)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.25)' }}>
      Regular
    </span>
  );
  return (
    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
      style={{ background: 'var(--bg-surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
      {estado}
    </span>
  );
}

export default function ClientesPage({
  filteredClientes,
  setClienteForm,
  setClienteFormOpen,
  setSelectedCustomer,
  isAdmin,
  deleteCliente
}) {
  return (
    <motion.div key="clientes" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="p-4 sm:p-8 flex flex-col gap-6 max-w-[1400px] w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Módulo de <span style={{ color: 'var(--primary)' }}>Clientes</span></h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Gestión de relaciones y fidelización</p>
        </div>
        <button
          onClick={() => { setClienteForm({ nombre:'', email:'', telefono:'', rut:'', tipo_cliente:'persona', razon_social:'', estado:'Nuevo' }); setClienteFormOpen(true); }}
          className="btn-primary flex items-center gap-2 w-fit"
        >
          <Plus size={15}/> Nuevo Cliente
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              {['Cliente','RUT / Tipo','Contacto','Visitas','Total Gastado','Estado','Acciones'].map(h => (
                <th key={h} className="px-5 py-4 text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredClientes.map(c => (
              <tr
                key={c.id}
                className="transition-all"
                style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <ClienteAvatar nombre={c.nombre} />
                    <span className="font-semibold text-white text-sm">{c.nombre}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm font-mono" style={{ color: 'var(--text-2)' }}>{c.rut || '—'}</p>
                  <span className={`text-[10px] font-bold uppercase flex items-center gap-1 mt-0.5 ${c.tipo_cliente==='empresa' ? 'text-blue-400' : 'text-zinc-500'}`}>
                    {c.tipo_cliente==='empresa' ? <><Building2 size={10}/>Empresa</> : 'Persona'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm" style={{ color: 'var(--text-2)' }}>{c.email || '—'}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>{c.telefono || ''}</p>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                    {c.visitas}
                  </span>
                </td>
                <td className="px-5 py-4 font-black text-white">${Number(c.total_gastado).toFixed(2)}</td>
                <td className="px-5 py-4">
                  <EstadoBadge estado={c.estado} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--purple)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.border = '1px solid var(--purple)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.border = '1px solid var(--border)'; }}
                    >
                      Historial
                    </button>
                    <button
                      onClick={() => { setClienteForm({...c}); setClienteFormOpen(true); }}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; }}
                    >
                      <FileText size={14}/>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => deleteCliente(c)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.border = '1px solid rgba(239,68,68,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.border = '1px solid var(--border)'; }}
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
          <div className="py-16 flex flex-col items-center gap-3" style={{ color: 'var(--text-3)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <Users size={24} className="opacity-40" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm" style={{ color: 'var(--text-2)' }}>Sin clientes registrados</p>
              <p className="text-xs mt-1">Agrega tu primer cliente para comenzar</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
