import React from 'react';

export default function SidebarItem({ icon: Icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150 select-none ${
        active
          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
          : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
      }`}
    >
      <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
      <span className={`text-sm ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
    </div>
  );
}
