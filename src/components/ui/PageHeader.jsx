/**
 * PageHeader — standard page-level heading used on every dashboard page.
 *
 * Renders:
 *   - optional status / demo badge row
 *   - h2 title with optional colored highlight word
 *   - optional subtitle
 *   - actions slot (buttons, filters, date picker)
 *
 * Usage:
 *   <PageHeader
 *     title="Gestión de"
 *     highlight="Pedidos"
 *     subtitle="Control de comandas en tiempo real"
 *     badges={[{ label: 'datos demo', variant: 'demo' }]}
 *     actions={<button ...>Nuevo pedido</button>}
 *   />
 */

import { color, text } from '@/lib/tokens'

const BADGE_VARIANTS = {
  demo:    { bg: 'rgba(245,158,11,0.10)', fg: '#F59E0B', border: 'rgba(245,158,11,0.18)' },
  live:    { bg: 'rgba(16,185,129,0.10)', fg: '#10B981', border: 'rgba(16,185,129,0.20)' },
  warning: { bg: 'rgba(245,158,11,0.10)', fg: '#F59E0B', border: 'rgba(245,158,11,0.18)' },
  error:   { bg: 'rgba(239,68,68,0.10)',  fg: '#EF4444', border: 'rgba(239,68,68,0.18)'  },
  purple:  { bg: 'rgba(139,92,246,0.10)', fg: '#A78BFA', border: 'rgba(139,92,246,0.18)' },
  neutral: { bg: 'rgba(255,255,255,0.06)', fg: '#9090B0', border: 'rgba(255,255,255,0.08)' },
}

function HeaderBadge({ label, variant = 'neutral', dot = false }) {
  const v = BADGE_VARIANTS[variant] || BADGE_VARIANTS.neutral
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        padding: '3px 10px',
        borderRadius: '9999px',
        background: v.bg,
        color: v.fg,
        border: `1px solid ${v.border}`,
        flexShrink: 0,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: v.fg,
            animation: 'pulse-dot 2.5s ease-in-out infinite',
            flexShrink: 0,
          }}
        />
      )}
      {label}
    </span>
  )
}

export default function PageHeader({
  title,
  highlight,
  highlightColor,
  subtitle,
  badges = [],
  actions,
  className = '',
}) {
  return (
    <div
      className={`flex justify-between items-end flex-wrap gap-4 ${className}`}
    >
      <div>
        {/* Badge row */}
        {badges.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            {badges.map((badge, i) => (
              <HeaderBadge key={i} {...badge} />
            ))}
          </div>
        )}

        {/* Title */}
        <h2
          className="tracking-tight leading-none"
          style={{
            fontSize: 'clamp(22px, 2.8vw, 28px)',
            fontWeight: 800,
            color: text.primary,
            letterSpacing: '-0.025em',
          }}
        >
          {title}{' '}
          {highlight && (
            <span style={{ color: highlightColor || '#A78BFA' }}>
              {highlight}
            </span>
          )}
        </h2>

        {/* Subtitle */}
        {subtitle && (
          <p
            style={{
              fontSize: 13,
              color: text.secondary,
              marginTop: 5,
              fontWeight: 400,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  )
}

export { HeaderBadge }
