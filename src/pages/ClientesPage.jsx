import React from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';
import { Plus, Users, Building2, FileText, Trash2, Star, Repeat2 } from 'lucide-react';

// Cult UI — spotlight cursor tracking for table rows
function SpotlightRow({ children, style, ...props }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlight = useMotionTemplate`radial-gradient(
    220px circle at ${mouseX}px ${mouseY}px,
    rgba(139,92,246,0.07),
    transparent 80%
  )`;

  return (
    <motion.tr
      onMouseMove={({ currentTarget, clientX, clientY }) => {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
      }}
      whileHover={{ backgroundColor: '#131316' }}
      style={{ cursor: 'pointer', background: spotlight, transition: 'background 0.15s ease', ...style }}
      {...props}
    >
      {children}
    </motion.tr>
  );
}

// Badge: "Nuevo" vs "Recurrente" (más de 3 visitas)
function VisitaBadge({ visitas }) {
  if (visitas > 3) return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider"
      style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }}
    >
      <Repeat2 size={8} /> Recurrente
    </span>
  );
  return (
    <span
      className="inline-flex items-center"
      style={{
        background: '#1A1A2E',
        border: '1px solid #4F46E5',
        color: '#818CF8',
        borderRadius: '4px',
        padding: '2px 8px',
        fontSize: '10px',
        fontWeight: 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      Nuevo
    </span>
  );
}

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
      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
      style={{
        background: `linear-gradient(135deg, ${from}, ${to})`,
        boxShadow: `0 0 0 2px #0D0D0F, 0 0 0 3px ${from}66`,
        fontSize: '13px',
        fontWeight: 500,
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
    <span
      className="inline-flex items-center"
      style={estado === 'Nuevo'
        ? { background: '#1A1A2E', border: '1px solid #4F46E5', color: '#818CF8', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }
        : { background: 'var(--bg-surface)', color: 'var(--text-3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }
      }
    >
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
    <motion.div key="clientes" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="p-4 sm:p-8 flex flex-col gap-8 max-w-[1400px] w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Módulo de <span style={{ color: 'var(--primary)' }}>Clientes</span></h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Gestión de relaciones y fidelización</p>
        </div>
        <button
          onClick={() => { setClienteForm({ nombre:'', email:'', telefono:'', rut:'', tipo_cliente:'persona', razon_social:'', estado:'Nuevo' }); setClienteFormOpen(true); }}
          className="flex items-center gap-2 w-fit rounded-xl cursor-pointer"
          style={{ height: '44px', padding: '0 24px', fontSize: '15px', fontWeight: 700, background: '#7C3AED', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(124,58,237,0.35)', transition: 'background 150ms' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#6D28D9'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#7C3AED'; }}
        >
          <Plus size={17}/> Nuevo Cliente
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: '1px solid #1F1F23', background: 'var(--bg-surface)' }}>
              {['Cliente','RUT / Tipo','Contacto','Visitas','Total Gastado','Estado','Acciones'].map(h => (
                <th key={h} className="px-5 pt-5" style={{ fontSize: '12.5px', fontWeight: 700, color: '#71717A', letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: '14px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredClientes.map(c => (
              <SpotlightRow
                key={c.id}
                className="transition-all"
                style={{ borderBottom: '1px solid #1F1F23' }}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <ClienteAvatar nombre={c.nombre} />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#F4F4F5' }}>{c.nombre}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p style={{ fontSize: '14px', fontFamily: 'monospace', color: '#A1A1AA' }}>{c.rut || '—'}</p>
                  <span
                    className={`flex items-center gap-1 mt-1 ${c.tipo_cliente === 'empresa' ? 'text-blue-400' : ''}`}
                    style={c.tipo_cliente === 'persona' ? {
                      display: 'inline-flex',
                      background: '#1C1C1F',
                      border: '1px solid #27272A',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '10px',
                      color: '#71717A',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    } : { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}
                  >
                    {c.tipo_cliente==='empresa' ? <><Building2 size={10}/>Empresa</> : 'Persona'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <p style={{ fontSize: '14px', color: '#818CF8' }}>{c.email || '—'}</p>
                  <p style={{ fontSize: '13px', color: '#71717A', marginTop: '2px' }}>{c.telefono || ''}</p>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col items-center gap-1">
                    <span style={{ fontSize: '15px', fontWeight: 500, color: '#F4F4F5' }}>
                      {c.visitas}
                    </span>
                    <VisitaBadge visitas={c.visitas} />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: Number(c.total_gastado) > 0 ? '#4ADE80' : '#3F3F46',
                  }}>
                    ${Number(c.total_gastado).toFixed(2)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <EstadoBadge estado={c.estado} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2 items-center justify-end">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="transition-all"
                      style={{ background: 'transparent', border: '1px solid #27272A', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', color: '#A1A1AA', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#1A0D2E'; e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.color = '#A78BFA'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#27272A'; e.currentTarget.style.color = '#A1A1AA'; }}
                    >
                      Historial
                    </button>
                    <button
                      onClick={() => { setClienteForm({...c}); setClienteFormOpen(true); }}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ background: 'transparent', border: 'none', color: '#3F3F46', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#A78BFA'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#3F3F46'; }}
                    >
                      <FileText size={15}/>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => deleteCliente(c)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ background: 'transparent', border: 'none', color: '#3F3F46', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#3F3F46'; }}
                        title="Eliminar cliente"
                      >
                        <Trash2 size={15}/>
                      </button>
                    )}
                  </div>
                </td>
              </SpotlightRow>
            ))}
          </tbody>
        </table>

        {filteredClientes.length === 0 && (
          <div className="py-24 flex flex-col items-center gap-4" style={{ color: 'var(--text-3)' }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <Users size={36} className="opacity-40" />
            </div>
            <div className="text-center">
              <p className="font-bold text-base" style={{ color: 'var(--text-2)' }}>Sin clientes registrados</p>
              <p className="text-sm mt-1.5">Agrega tu primer cliente para comenzar</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
