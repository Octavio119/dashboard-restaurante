import React from 'react';

export default function SidebarItem({ icon: Icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className="flex items-center gap-[10px] rounded-xl cursor-pointer select-none"
      style={{
        padding: active ? '10px 16px 10px 14px' : '10px 16px',
        background: active
          ? 'linear-gradient(135deg, rgba(139,92,246,.16), rgba(139,92,246,.06))'
          : 'transparent',
        borderLeft: active ? '2px solid var(--purple)' : '2px solid transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        transition: 'all 180ms ease',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(139,92,246,.07)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon
        size={16}
        strokeWidth={active ? 2.2 : 1.8}
        style={{
          color: active ? 'var(--purple)' : 'var(--text-secondary)',
          flexShrink: 0,
          filter: active ? 'drop-shadow(0 0 5px rgba(139,92,246,0.55))' : undefined,
          transition: 'filter 180ms ease, color 180ms ease',
        }}
      />
      <span style={{ fontSize: '14px', fontWeight: active ? 600 : 500, transition: 'font-weight 180ms' }}>
        {label}
      </span>
      {active && (
        <div
          className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: 'var(--purple)', boxShadow: '0 0 7px rgba(139,92,246,0.85)' }}
        />
      )}
    </div>
  );
}
