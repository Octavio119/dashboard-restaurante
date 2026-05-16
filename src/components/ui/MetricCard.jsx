import { useEffect, useRef } from "react"
import { motion, animate } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"
import { MagicCard } from "./magic-card"
import { BorderBeam } from "./border-beam"

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

/**
 * Animates numeric portion of `value` on mount and on value change.
 * Handles prefixes like "$" and Chilean formatting.
 */
function AnimatedValue({ value }) {
  const ref = useRef(null)

  useEffect(() => {
    const str   = String(value)
    const prefix = (str.match(/^[^0-9]*/) || [""])[0]
    const digits = str.replace(/[^0-9]/g, "")
    const num    = parseInt(digits, 10)

    if (!ref.current) return
    if (isNaN(num) || num === 0) {
      ref.current.textContent = value
      return
    }

    const from = Math.max(0, Math.round(num * 0.55))
    const ctrl = animate(from, num, {
      duration: 0.75,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate(v) {
        if (ref.current)
          ref.current.textContent = prefix + Math.round(v).toLocaleString("es-CL")
      },
    })
    return ctrl.stop
  }, [value])

  return (
    <span
      ref={ref}
      className="text-[28px] font-bold leading-none tracking-tight tabular-nums"
      style={{ color: "var(--text-1)" }}
    >
      {value}
    </span>
  )
}

export default function MetricCard({
  title, value, trend, icon: Icon, iconColor = "#8B5CF6",
  beamFrom, beamTo, beamDelay = 0, beamDuration = 8,
}) {
  const positive = trend >= 0
  const [r, g, b]  = hexToRgb(iconColor)

  return (
    <MagicCard
      gradientColor={`rgba(${r},${g},${b},0.06)`}
      className="cursor-default p-5"
    >
      {beamFrom && beamTo && (
        <BorderBeam
          size={80}
          duration={beamDuration}
          colorFrom={beamFrom}
          colorTo={beamTo}
          delay={beamDelay}
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="flex flex-col gap-4"
      >
        {/* Icon + trend */}
        <div className="flex items-center justify-between">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: `rgba(${r},${g},${b},0.10)` }}
          >
            <Icon size={14} style={{ color: iconColor }} />
          </div>

          <span
            className="flex items-center gap-1 rounded-full px-2 py-[3px] text-[11px] font-semibold"
            style={{
              background: positive ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              color: positive ? "#10B981" : "#EF4444",
            }}
          >
            {positive
              ? <TrendingUp  size={9} strokeWidth={2.5} />
              : <TrendingDown size={9} strokeWidth={2.5} />}
            {Math.abs(trend)}%
          </span>
        </div>

        {/* Label + value */}
        <div className="flex flex-col gap-1.5">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.09em]"
            style={{ color: "var(--text-3)" }}
          >
            {title}
          </p>
          <AnimatedValue value={value} />
        </div>
      </motion.div>
    </MagicCard>
  )
}
