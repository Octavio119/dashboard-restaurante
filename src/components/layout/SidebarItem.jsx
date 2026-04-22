import React from 'react';

export default function SidebarItem({ icon: Icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all select-none ${
        active ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
      }`}
    >
      <Icon size={18} />
      <span className="font-semibold text-sm">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />}
    </div>
  );
}
