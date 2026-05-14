/**
 * MastexoPOS Skeleton System
 *
 * Named exports:
 *   SkeletonLine        — single shimmer line (text placeholder)
 *   SkeletonBlock       — rectangular shimmer block
 *   SkeletonAvatar      — circular avatar shimmer
 *   SkeletonMetric      — full KPI card placeholder
 *   SkeletonMetricGrid  — responsive grid of N metric cards
 *   SkeletonChart       — area chart with header + wave bars + ticks
 *   SkeletonRow         — single <tr> placeholder (use inside <tbody>)
 *   SkeletonTable       — complete table card + N skeleton rows
 *   SkeletonCard        — generic card with avatar + two text lines
 *   SkeletonKitchenStrip— horizontal scrollable kitchen order cards
 *   SkeletonFade        — AnimatePresence swap: skeleton → real content
 *
 * Requires @keyframes skeleton-shimmer in index.css (already present).
 */

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { surface, border, radius } from '@/lib/tokens'

// ── Shimmer base style ────────────────────────────────────────────────────────
// The keyframe is declared in index.css so it plays correctly in all contexts.
const shimmer = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%)',
  backgroundSize: '800px 100%',
  animation: 'skeleton-shimmer 1.6s ease-in-out infinite',
  flexShrink: 0,
}

// ── Primitives ────────────────────────────────────────────────────────────────

/** Single shimmer line — replaces any short text string */
export function SkeletonLine({ width = '100%', height = 12, style = {}, className = '' }) {
  return (
    <div
      className={className}
      style={{
        ...shimmer,
        width,
        height,
        borderRadius: typeof height === 'number' && height <= 14 ? height / 2 : radius.xs,
        ...style,
      }}
    />
  )
}

/** Rectangular shimmer block — replaces an image, icon box, or arbitrary area */
export function SkeletonBlock({ width = '100%', height = 40, borderRadius: br, className = '', style = {} }) {
  return (
    <div
      className={className}
      style={{ ...shimmer, width, height, borderRadius: br || radius.sm, ...style }}
    />
  )
}

/** Circular shimmer — replaces an avatar, icon button, or status dot */
export function SkeletonAvatar({ size = 32 }) {
  return <div style={{ ...shimmer, width: size, height: size, borderRadius: '50%' }} />
}

// ── Compound patterns ─────────────────────────────────────────────────────────

/** Full KPI metric card — mirrors MetricCard layout exactly */
export function SkeletonMetric() {
  return (
    <div
      style={{
        background: surface.card,
        border: `1px solid ${border.base}`,
        borderRadius: radius.lg,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SkeletonBlock width={32} height={32} borderRadius={radius.sm} />
        <SkeletonLine width={40} height={9} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SkeletonLine width="55%" height={9} />
        <SkeletonLine width="72%" height={26} style={{ borderRadius: radius.xs }} />
      </div>
    </div>
  )
}

/** Responsive grid of N SkeletonMetric cards — drop-in for 2/3/4 col KPI rows */
export function SkeletonMetricGrid({ count = 4, cols, className = '' }) {
  const gridCols = cols || Math.min(count, 4)
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gap: '12px',
      }}
    >
      {Array.from({ length: count }).map((_, i) => <SkeletonMetric key={i} />)}
    </div>
  )
}

/**
 * Area chart placeholder — matches the Recharts AreaChart panels.
 * Renders a header row, animated wave bars, and X-axis tick stubs.
 */
export function SkeletonChart({ height = 220, className = '' }) {
  const bars = [62, 38, 78, 52, 88, 44, 68]
  return (
    <div
      className={className}
      style={{
        background: surface.card,
        border: `1px solid ${border.base}`,
        borderRadius: radius.lg,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Chart header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SkeletonLine width={72} height={9} />
          <SkeletonLine width={160} height={13} />
        </div>
        <SkeletonLine width={60} height={9} />
      </div>

      {/* Wave bar approximation of an area chart */}
      <div style={{ height, display: 'flex', alignItems: 'flex-end', gap: '6px', padding: '0 2px' }}>
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              ...shimmer,
              flex: 1,
              height: `${h}%`,
              borderRadius: `${radius.xs} ${radius.xs} 0 0`,
            }}
          />
        ))}
      </div>

      {/* X-axis ticks */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {Array.from({ length: 7 }).map((_, i) => <SkeletonLine key={i} width={24} height={9} />)}
      </div>
    </div>
  )
}

/**
 * Single table row placeholder.
 * Must be rendered inside a <tbody> — keeps valid table structure.
 *
 * @param {number}   cols   — number of columns to render
 * @param {string[]} widths — optional per-column widths (cycles if fewer than cols)
 */
export function SkeletonRow({ cols = 5, widths }) {
  const fallbackWidths = ['80px', '140px', '200px', '80px', '70px', '40px']
  const w = widths || fallbackWidths
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 24px' }}>
          <SkeletonLine width={w[i % w.length]} />
        </td>
      ))}
    </tr>
  )
}

/** Complete table card: header strip + N skeleton rows */
export function SkeletonTable({ rows = 5, cols = 5, widths, className = '' }) {
  return (
    <div
      className={className}
      style={{
        background: surface.card,
        border: `1px solid ${border.base}`,
        borderRadius: radius.lg,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <SkeletonLine width={140} height={13} />
        <SkeletonLine width={60} height={10} />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} cols={cols} widths={widths} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Generic card: avatar + two text lines — use for list items or feed rows */
export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={className}
      style={{
        background: surface.card,
        border: `1px solid ${border.base}`,
        borderRadius: radius.lg,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <SkeletonAvatar size={36} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SkeletonLine width="60%" />
          <SkeletonLine width="40%" height={10} />
        </div>
      </div>
      <SkeletonLine width="80%" />
      <SkeletonLine width="55%" />
    </div>
  )
}

/** Horizontal kitchen order strip — mirrors the KitchenCard component */
export function SkeletonKitchenStrip({ count = 4 }) {
  return (
    <div style={{ display: 'flex', gap: '12px', overflow: 'hidden' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            flexShrink: 0,
            width: '168px',
            background: surface.card,
            border: `1px solid ${border.base}`,
            borderRadius: radius.md,
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <SkeletonLine width={58} height={11} />
            <SkeletonLine width={48} height={11} />
          </div>
          <SkeletonLine width="88%" height={9} />
          <SkeletonLine width="60%" height={9} />
          <SkeletonLine width={56} height={12} />
        </div>
      ))}
    </div>
  )
}

// ── SkeletonFade ──────────────────────────────────────────────────────────────

/**
 * AnimatePresence swap: shows `skeleton` while loading, then cross-fades to
 * `children` when data arrives. No layout shift — both slots occupy the same
 * DOM position.
 *
 * @example
 * <SkeletonFade
 *   loading={pedidosLoading}
 *   skeleton={<SkeletonTable rows={6} cols={6} />}
 * >
 *   <RealTable rows={orders} />
 * </SkeletonFade>
 */
export function SkeletonFade({ loading, skeleton, children, duration = 0.3 }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {loading ? (
        <motion.div
          key="sk"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: duration * 0.55, ease: 'easeIn' } }}
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Namespace default export ──────────────────────────────────────────────────
export default {
  Line:          SkeletonLine,
  Block:         SkeletonBlock,
  Avatar:        SkeletonAvatar,
  Metric:        SkeletonMetric,
  MetricGrid:    SkeletonMetricGrid,
  Chart:         SkeletonChart,
  Row:           SkeletonRow,
  Table:         SkeletonTable,
  Card:          SkeletonCard,
  KitchenStrip:  SkeletonKitchenStrip,
  Fade:          SkeletonFade,
}
