import { cn } from "@/lib/utils"

/**
 * Cult UI — ShineBorder
 * Animated radial-gradient border that sweeps around the element.
 * Use as a wrapper: <ShineBorder color={[...]}><YourCard /></ShineBorder>
 */
export function ShineBorder({
  children,
  className,
  color = ["#A07CFE", "#FE8FB5", "#FFBE7B"],
  borderWidth = 1.5,
  duration = 14,
  style,
  ...props
}) {
  const colors = Array.isArray(color) ? color.join(", ") : color

  return (
    <div
      className={cn("relative", className)}
      style={style}
      {...props}
    >
      {/* Animated border layer — absolute, clipped to border-area only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          border: `${borderWidth}px solid transparent`,
          backgroundImage: `radial-gradient(ellipse at 50% 0%, transparent 20%, ${colors}, transparent 80%)`,
          backgroundSize: "400% 400%",
          animation: `shine-border-move ${duration}s linear infinite`,
          WebkitMask:
            "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "destination-out",
          mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
        }}
      />
      {children}
    </div>
  )
}
