/**
 * Cult UI — cosmic-button
 * Spotlight cursor tracking + shimmer border + floating star particles.
 * motion/react is aliased to framer-motion in vite.config.js.
 */
import { motion, useMotionTemplate, useMotionValue } from "motion/react"
import { cn } from "@/lib/utils"

function CosmicButton({ children, className, ...props }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function onMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  const spotlight = useMotionTemplate`radial-gradient(
    180px circle at ${mouseX}px ${mouseY}px,
    rgba(139,92,246,0.18),
    transparent 80%
  )`

  return (
    <motion.button
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden",
        "rounded-[12px] border border-white/10 bg-[#12121E] px-6 py-2.5",
        "text-sm font-semibold text-white/80 transition-all duration-300",
        "hover:border-violet-500/50 hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onMouseMove={onMouseMove}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...props}
    >
      {/* Cursor spotlight */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[12px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: spotlight }}
      />

      {/* Shimmer gradient border */}
      <div
        className="absolute inset-0 rounded-[12px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(135deg, rgba(139,92,246,0.3) 0%, transparent 50%, rgba(139,92,246,0.1) 100%)",
        }}
      />

      {/* Solid bg on top of shimmer */}
      <div className="absolute inset-[1px] rounded-[11px] bg-[#12121E]" />

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-500/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Floating star particles */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute h-[3px] w-[3px] rounded-full bg-violet-400/70"
          style={{ left: `${22 + i * 28}%`, top: `${35 + (i % 2) * 30}%` }}
          animate={{ opacity: [0, 0.9, 0], scale: [0, 1, 0], y: [0, -10, -20] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.45, ease: "easeOut" }}
        />
      ))}

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  )
}

export { CosmicButton }
