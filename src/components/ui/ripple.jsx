import { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

export function RippleButton({ children, className, style, onClick, onMouseEnter, onMouseLeave, ...props }) {
  const containerRef = useRef(null);

  const handleClick = useCallback((e) => {
    const btn = containerRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const span = document.createElement('span');
      span.className = 'ripple-effect';
      span.style.cssText = `left:${x}px;top:${y}px`;
      btn.appendChild(span);
      setTimeout(() => span.remove(), 580);
    }
    onClick?.(e);
  }, [onClick]);

  return (
    <button
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={style}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {children}
    </button>
  );
}
