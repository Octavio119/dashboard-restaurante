/**
 * Cult UI — MagicCard
 * Cursor spotlight tracking. Professional, not gamer.
 * Glow removed. Border stays subtle, lifts 1 shade on hover.
 */
import { motion, useMotionTemplate, useMotionValue } from "motion/react"
import { cn } from "@/lib/utils"

function MagicCard({
  children,
  className,
  gradientColor = "rgba(139,92,246,0.06)",
  gradientSize  = 300,
  ...props
}) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function onMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  const spotlight = useMotionTemplate`radial-gradient(
    ${gradientSize}px circle at ${mouseX}px ${mouseY}px,
    ${gradientColor},
    transparent 80%
  )`

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[12px]",
        "border border-white/[0.055] bg-[#12121E]",
        "transition-[border-color,box-shadow] duration-200",
        "hover:border-white/[0.09]",
        className
      )}
      onMouseMove={onMouseMove}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: spotlight }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}

export { MagicCard }
