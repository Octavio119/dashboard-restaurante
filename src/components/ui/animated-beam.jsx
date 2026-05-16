import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  colorFrom = '#7C3AED',
  colorTo = '#4F46E5',
  duration = 3,
  curvature = 0,
  className,
}) {
  const [pathD, setPathD] = useState('');
  const uidRef = useRef(null);
  if (uidRef.current === null) uidRef.current = Math.random().toString(36).slice(2, 8);
  const uid = uidRef.current;

  useEffect(() => {
    function updatePath() {
      if (!containerRef.current || !fromRef.current || !toRef.current) return;
      const cRect = containerRef.current.getBoundingClientRect();
      const fRect = fromRef.current.getBoundingClientRect();
      const tRect = toRef.current.getBoundingClientRect();

      // Connect right-center → left-center
      const x1 = fRect.right  - cRect.left;
      const y1 = fRect.top    - cRect.top  + fRect.height / 2;
      const x2 = tRect.left   - cRect.left;
      const y2 = tRect.top    - cRect.top  + tRect.height / 2;

      const cx = (x1 + x2) / 2;
      setPathD(`M${x1},${y1} C${cx},${y1 + curvature} ${cx},${y2 - curvature} ${x2},${y2}`);
    }

    updatePath();
    const ro = new ResizeObserver(updatePath);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', updatePath);
    return () => { ro.disconnect(); window.removeEventListener('resize', updatePath); };
  }, [containerRef, fromRef, toRef, curvature]);

  if (!pathD) return null;

  const gradId  = `bg-${uid}`;
  const animId  = `bm-${uid}`;

  return (
    <svg
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 h-full w-full overflow-visible', className)}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={colorFrom} stopOpacity="0" />
          <stop offset="30%"  stopColor={colorFrom} stopOpacity="0.9" />
          <stop offset="70%"  stopColor={colorTo}   stopOpacity="0.9" />
          <stop offset="100%" stopColor={colorTo}   stopOpacity="0" />
        </linearGradient>
        <style>{`
          @keyframes ${animId} {
            0%   { stroke-dashoffset: 600; }
            100% { stroke-dashoffset: -600; }
          }
        `}</style>
      </defs>

      {/* Dim base track */}
      <path d={pathD} fill="none" stroke="rgba(124,58,237,0.12)" strokeWidth="1.5" strokeLinecap="round" />

      {/* Travelling beam */}
      <path
        d={pathD}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="2"
        strokeLinecap="round"
        style={{
          strokeDasharray: '80 9999',
          animation: `${animId} ${duration}s linear infinite`,
        }}
      />
    </svg>
  );
}
