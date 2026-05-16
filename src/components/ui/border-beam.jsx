import { cn } from "@/lib/utils"

/**
 * Cult UI — BorderBeam
 * A traveling beam of light that moves along the border of a card.
 * Requires `position: relative` and `overflow: hidden` on the parent.
 */
export function BorderBeam({
  className,
  size = 200,
  duration = 15,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  delay = 0,
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 rounded-[inherit]", className)}
      style={{
        border: `${borderWidth}px solid transparent`,
        WebkitMask:
          "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "destination-out",
        mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
        maskComposite: "exclude",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          aspectRatio: "1 / 1",
          width: `${size}px`,
          background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          offsetAnchor: `${anchor}% 50%`,
          animation: `border-beam ${duration}s linear infinite`,
          animationDelay: `-${delay}s`,
        }}
      />
    </div>
  )
}
