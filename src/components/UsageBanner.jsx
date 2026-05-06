import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function UsageBanner() {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    api.getBillingUsage().then(setUsage).catch(() => {});
  }, []);

  if (!usage || usage.plan !== 'free' || usage.ordenes_limite === null) return null;

  const pct = usage.porcentaje;
  const barColor   = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : 'linear-gradient(90deg, #8B5CF6, #EC4899)';
  const textColor  = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#8B5CF6';
  const borderColor = pct >= 90 ? 'rgba(239,68,68,.3)' : pct >= 70 ? 'rgba(245,158,11,.3)' : 'rgba(139,92,246,.3)';
  const bgColor    = pct >= 90 ? 'rgba(239,68,68,.08)' : pct >= 70 ? 'rgba(245,158,11,.08)' : 'rgba(139,92,246,.08)';

  return (
    <div
      className="mx-4 mb-3 rounded-[10px] border px-4 py-3 text-sm"
      style={{ background: bgColor, borderColor }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-medium" style={{ color: textColor }}>
          Órdenes este mes: {usage.ordenes_usadas} / {usage.ordenes_limite}
        </span>
        <span className="font-bold" style={{ color: textColor }}>{pct}%</span>
      </div>

      <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,.08)' }}>
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
        />
      </div>

      {pct >= 80 && (
        <p className="mt-2 text-xs" style={{ color: textColor }}>
          Estás cerca del límite.{' '}
          <a href="/billing" className="font-semibold underline">
            Mejora tu plan para continuar sin interrupciones.
          </a>
        </p>
      )}
    </div>
  );
}
