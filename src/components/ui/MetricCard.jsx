import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function MetricCard({ title, value, trend, icon: Icon }) {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="p-2.5 rounded-lg bg-zinc-800 text-amber-500 border border-zinc-700">
          <Icon size={18} />
        </div>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${trend >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          <TrendingUp size={11} className={trend < 0 ? 'rotate-180' : ''} />
          {Math.abs(trend)}%
        </span>
      </div>
      <div>
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-black text-white mt-0.5">{value}</h3>
      </div>
    </div>
  );
}
