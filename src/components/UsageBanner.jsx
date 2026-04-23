import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function UsageBanner() {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    api.getBillingUsage().then(setUsage).catch(() => {});
  }, []);

  if (!usage || usage.plan !== 'free' || usage.ordenes_limite === null) return null;

  const pct   = usage.porcentaje;
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-400' : 'bg-green-500';
  const texto = pct >= 90 ? 'text-red-700' : pct >= 70 ? 'text-orange-700' : 'text-green-700';
  const fondo = pct >= 90 ? 'bg-red-50 border-red-200' : pct >= 70 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200';

  return (
    <div className={`mx-4 mb-3 rounded-lg border px-4 py-3 text-sm ${fondo}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`font-medium ${texto}`}>
          Órdenes este mes: {usage.ordenes_usadas} / {usage.ordenes_limite}
        </span>
        <span className={`font-bold ${texto}`}>{pct}%</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {pct >= 80 && (
        <p className={`mt-2 text-xs ${texto}`}>
          Estás cerca del límite.{' '}
          <a href="/billing" className="font-semibold underline">
            Mejora tu plan para continuar sin interrupciones.
          </a>
        </p>
      )}
    </div>
  );
}
