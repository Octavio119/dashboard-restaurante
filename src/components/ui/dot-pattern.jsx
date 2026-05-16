import { useId } from 'react';
import { cn } from '@/lib/utils';

export function DotPattern({
  color = '#7C3AED',
  size = 20,
  dotRadius = 1.2,
  opacity = 0.15,
  className,
  style,
}) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      style={{ opacity, ...style }}
    >
      <defs>
        <pattern
          id={id}
          x="0"
          y="0"
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={size / 2} cy={size / 2} r={dotRadius} fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
