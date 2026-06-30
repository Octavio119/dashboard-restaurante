import { TrendingUp, TrendingDown } from 'lucide-react'

export function KpiCard({ title, icon: Icon, iconColor = '#8B5CF6', trend, children }) {
  const hasTrend = trend !== undefined && trend !== null
  const positive = hasTrend && trend >= 0
  return (
    <div
      className="relative min-w-0 flex flex-col gap-3.5 h-full"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        minHeight: '120px',
      }}
    >
      {hasTrend && (
        <span
          className="absolute top-3.5 right-3.5 flex shrink-0 items-center gap-1 rounded-full px-2 py-[3px] text-[11px] font-semibold"
          style={{
            background: positive ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            color: positive ? '#10B981' : '#EF4444',
          }}
        >
          {positive
            ? <TrendingUp size={9} strokeWidth={2.5} />
            : <TrendingDown size={9} strokeWidth={2.5} />}
          {Math.abs(trend)}%
        </span>
      )}

      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${iconColor}1A` }}
      >
        <Icon size={18} style={{ color: iconColor }} />
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <p
          className="truncate uppercase"
          style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500, letterSpacing: '1px' }}
        >
          {title}
        </p>
        <div
          className="truncate tabular-nums leading-none"
          style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-1)' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
