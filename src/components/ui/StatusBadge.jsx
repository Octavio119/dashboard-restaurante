import React from 'react';

export default function StatusBadge({ status }) {
  const map = {
    pendiente:       'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'en preparación':'bg-blue-500/10 text-blue-400 border-blue-500/20',
    listo:           'bg-purple-500/10 text-purple-400 border-purple-500/20',
    entregado:       'bg-green-500/10 text-green-400 border-green-500/20',
    confirmado:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    confirmada:      'bg-green-500/10 text-green-400 border-green-500/20',
    cancelada:       'bg-red-500/10 text-red-400 border-red-500/20',
    'asistió':       'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${map[status] || 'bg-zinc-700 text-zinc-400 border-zinc-600'}`}>
      {status}
    </span>
  );
}
