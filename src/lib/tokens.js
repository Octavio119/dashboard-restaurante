/**
 * MastexoPOS Design Tokens — JS bridge
 *
 * Use these values inside inline style props so components never
 * hardcode hex values.  All values mirror dashboard-theme.css :root.
 *
 * Usage:
 *   import { tokens, alpha } from '@/lib/tokens'
 *   style={{ background: tokens.surface.card, color: tokens.text.primary }}
 *   style={{ background: alpha(tokens.color.purple, 0.1) }}
 */

// ── Surfaces ──────────────────────────────────────────────────────────
export const surface = {
  base:    '#0A0A12',
  nav:     '#0D0D18',
  card:    '#0F0F17',
  raised:  '#12121E',
  overlay: '#16162A',
  input:   '#1A1A2E',
  inset:   '#0C0C15',
}

// ── Brand & semantic colors ───────────────────────────────────────────
export const color = {
  purple:      '#8B5CF6',
  purpleDark:  '#7C3AED',
  purpleDeep:  '#6D28D9',
  green:       '#10B981',
  blue:        '#3B82F6',
  amber:       '#F59E0B',
  red:         '#EF4444',
  indigo:      '#6366F1',
  teal:        '#1D9E75',
  pink:        '#EC4899',
  cyan:        '#06B6D4',
}

// ── Text ──────────────────────────────────────────────────────────────
export const text = {
  primary:   '#F0F0FF',
  secondary: '#9090B0',
  muted:     '#50506A',
  dim:       '#374151',
}

// ── Borders ───────────────────────────────────────────────────────────
export const border = {
  base:   'rgba(255,255,255,0.06)',
  hover:  'rgba(255,255,255,0.09)',
  active: 'rgba(139,92,246,0.35)',
  focus:  'rgba(139,92,246,0.55)',
}

// ── Radius ────────────────────────────────────────────────────────────
export const radius = {
  xs:  '6px',
  sm:  '8px',
  md:  '12px',
  lg:  '16px',
  xl:  '20px',
  '2xl': '24px',
  full: '9999px',
}

// ── Shadow ────────────────────────────────────────────────────────────
export const shadow = {
  xs:      '0 1px 2px rgba(0,0,0,0.3)',
  sm:      '0 2px 8px rgba(0,0,0,0.4)',
  md:      '0 4px 16px rgba(0,0,0,0.45)',
  lg:      '0 8px 32px rgba(0,0,0,0.5)',
  xl:      '0 16px 48px rgba(0,0,0,0.55)',
  overlay: '0 24px 80px rgba(0,0,0,0.65)',
}

// ── Easing ────────────────────────────────────────────────────────────
export const ease = {
  spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  out:    'cubic-bezier(0.0, 0.0, 0.2, 1)',
  inOut:  'cubic-bezier(0.4, 0, 0.2, 1)',
}

// ── Duration ──────────────────────────────────────────────────────────
export const duration = {
  instant: 80,
  fast:    150,
  base:    200,
  slow:    300,
  xslow:   500,
}

// ── Helper: hex color → rgba with opacity ────────────────────────────
export function alpha(hex, opacity) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${opacity})`
}

// ── Helper: get [r,g,b] array from hex ────────────────────────────────
export function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ]
}

// ── Color palette per semantic intent ────────────────────────────────
export const palette = {
  positive: { fg: color.green,  bg: alpha(color.green, 0.10),  border: alpha(color.green, 0.18) },
  warning:  { fg: color.amber,  bg: alpha(color.amber, 0.10),  border: alpha(color.amber, 0.18) },
  danger:   { fg: color.red,    bg: alpha(color.red, 0.10),    border: alpha(color.red, 0.18) },
  info:     { fg: color.blue,   bg: alpha(color.blue, 0.10),   border: alpha(color.blue, 0.18) },
  brand:    { fg: color.purple, bg: alpha(color.purple, 0.10), border: alpha(color.purple, 0.18) },
  neutral:  { fg: text.secondary, bg: 'rgba(255,255,255,0.06)', border: border.base },
}

// ── Pre-built style objects for common patterns ───────────────────────

/** Standard dark card */
export const cardStyle = {
  background: surface.card,
  border: `1px solid ${border.base}`,
  borderRadius: radius.lg,
}

/** Standard dark panel (table containers, analytics panels) */
export const panelStyle = {
  background: surface.card,
  border: `1px solid ${border.base}`,
  borderRadius: radius.lg,
  overflow: 'hidden',
}

/** Panel divider line */
export const panelDivider = {
  borderBottom: `1px solid rgba(255,255,255,0.05)`,
}

/** Modal backdrop */
export const backdropStyle = {
  background: 'rgba(0,0,0,0.78)',
  backdropFilter: 'blur(8px)',
}

/** Modal card */
export const modalCardStyle = {
  background: surface.raised,
  border: `1px solid rgba(255,255,255,0.08)`,
  borderRadius: radius.xl,
  boxShadow: shadow.overlay,
}

/** Primary button style object */
export const btnPrimary = {
  background: color.purpleDark,
  color: '#fff',
}
export const btnPrimaryHover = {
  background: color.purpleDeep,
}

/** Ghost button style object */
export const btnGhost = {
  background: 'transparent',
  border: `1px solid ${border.base}`,
  color: text.secondary,
}

/** Namespaced export for convenience */
const tokens = {
  surface,
  color,
  text,
  border,
  radius,
  shadow,
  ease,
  duration,
  palette,
  cardStyle,
  panelStyle,
  panelDivider,
  backdropStyle,
  modalCardStyle,
  btnPrimary,
  btnPrimaryHover,
  btnGhost,
  alpha,
  hexToRgb,
}

export default tokens
