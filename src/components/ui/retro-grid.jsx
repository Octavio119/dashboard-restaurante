import { cn } from '@/lib/utils';

export function RetroGrid({ className, angle = 65, opacity = 0.5 }) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{ '--grid-angle': `${angle}deg`, opacity }}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))] [transform-origin:top_center]">
        <div
          className="animate-grid"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(124,58,237,0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(124,58,237,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            height: '300%',
            width: '200%',
            marginLeft: '-50%',
          }}
        />
      </div>
      {/* Fade-out gradient at the bottom */}
      <div className="absolute inset-0 [background:linear-gradient(transparent_60%,var(--background,#0A0A12)_100%)]" />
    </div>
  );
}
