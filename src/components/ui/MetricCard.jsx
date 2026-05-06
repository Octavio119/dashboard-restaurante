import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

export default function MetricCard({ title, value, trend, icon: Icon, iconColor }) {
  const positive = trend >= 0;
  const ic = iconColor || '#8B5CF6';
  const iconBg = ic.startsWith('#') ? hexToRgba(ic, 0.12) : 'rgba(139,92,246,.12)';

  return (
    <div
      className="dash-card metric-card cursor-default flex flex-col gap-4"
      style={{
        borderTop: `2px solid ${ic}`,
        background: `linear-gradient(135deg, ${ic}0D 0%, var(--bg-card-2) 60%)`,
      }}
    >
      <div className="flex justify-between items-start">
        <div className="metric-icon" style={{ background: iconBg }}>
          <Icon size={18} style={{ color: ic }} />
        </div>
        <span className={positive ? 'badge-positive' : 'badge-negative'}>
          {positive
            ? <TrendingUp size={10} className="inline mr-0.5" />
            : <TrendingDown size={10} className="inline mr-0.5" />}
          {Math.abs(trend)}%
        </span>
      </div>

      <div>
        <p className="metric-label">{title}</p>
        <h3 className="metric-value">{value}</h3>
      </div>
    </div>
  );
}
