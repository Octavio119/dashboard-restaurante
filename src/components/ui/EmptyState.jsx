import { motion } from 'framer-motion'
import { alpha, color, surface, border, radius, text } from '@/lib/tokens'

/**
 * EmptyState — standard zero-data placeholder used across all modules.
 *
 * @param {React.ElementType} icon   — Lucide icon component
 * @param {string}  title            — Primary message
 * @param {string}  subtitle         — Secondary hint
 * @param {string}  iconColor        — Token color hex (defaults to purple)
 * @param {React.ReactNode} action   — Optional CTA button/element
 * @param {boolean} compact          — Reduced padding for inline usage
 */
export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  iconColor = color.purple,
  action,
  compact = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center text-center"
      style={{ padding: compact ? '40px 24px' : '72px 32px', gap: '16px' }}
    >
      {Icon && (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: alpha(iconColor, 0.08),
            border: `1px solid ${alpha(iconColor, 0.15)}`,
            flexShrink: 0,
          }}
        >
          <Icon size={22} style={{ color: alpha(iconColor, 0.55) }} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <p
          className="font-semibold"
          style={{ fontSize: 14, color: text.secondary }}
        >
          {title}
        </p>
        {subtitle && (
          <p style={{ fontSize: 12, color: text.muted }}>
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div style={{ marginTop: 4 }}>{action}</div>
      )}
    </motion.div>
  )
}
