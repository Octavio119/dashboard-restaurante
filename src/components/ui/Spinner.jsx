import React from 'react';

const sizes = {
  sm: 'w-3.5 h-3.5 border-2',
  md: 'w-5 h-5 border-2',
  lg: 'w-8 h-8 border-[3px]',
};

const trackColors = {
  violet: 'border-violet-500/20 border-t-violet-500',
  amber:  'border-amber-500/20 border-t-amber-500',
  white:  'border-white/20 border-t-white',
};

export default function Spinner({ size = 'md', color = 'violet', className = '' }) {
  return (
    <span
      className={`inline-block rounded-full animate-spin ${sizes[size]} ${trackColors[color]} ${className}`}
      aria-label="Cargando"
    />
  );
}
