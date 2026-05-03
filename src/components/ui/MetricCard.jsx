import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricCard({ title, value, trend, icon: Icon }) {
  const positive = trend >= 0;
  return (
    <div className="card card-hover p-5 flex flex-col gap-4 group cursor-default">
      <div className="flex justify-between items-start">
        <div className="p-2.5 rounded-lg bg-zinc-800 text-amber-500 border border-zinc-700 group-hover:border-zinc-600 transition-colors duration-200">
          <Icon size={18} />
        </div>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
          positive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {Math.abs(trend)}%
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <p className="text-zinc-500 text-[11px] font-semibold uppercase tracking-widest">{title}</p>
        <h3 className="text-[1.75rem] font-black text-white leading-none tracking-tight">{value}</h3>
      </div>
    </div>
  );
}
