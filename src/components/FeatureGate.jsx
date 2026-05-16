import React from 'react';
import { Lock } from 'lucide-react';
import { usePlan } from '../hooks/usePlan';
import { showUpgradeModal } from './ui/PlanUpgradeModal';

/**
 * Wraps any content with a plan-gated overlay.
 *
 * If the user's plan includes the feature, children render normally.
 * Otherwise, children are blurred and an upgrade overlay is shown.
 *
 * Props:
 *   feature   — key from PLAN_LIMITS (e.g. "analytics", "ticketsPDF", "apiKeys")
 *   children  — content to gate
 *   fallback  — optional custom locked UI (overrides default blur overlay)
 *   inline    — if true, renders a compact locked badge instead of full overlay
 */
export default function FeatureGate({ feature, children, fallback, inline = false }) {
  const { can, requiredPlanFor } = usePlan();

  if (can(feature)) return children;

  const requiredPlan = requiredPlanFor(feature);

  const openModal = () => showUpgradeModal({ feature, requiredPlan });

  if (fallback) return fallback;

  if (inline) {
    return (
      <button
        onClick={openModal}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest cursor-pointer transition-opacity hover:opacity-80"
        style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}
      >
        <Lock size={9} />
        {requiredPlan}
      </button>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Blurred content — shows users what they're missing */}
      <div style={{ filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.55 }}>
        {children}
      </div>

      {/* Lock overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer"
        style={{ background: 'rgba(9,9,17,0.65)', backdropFilter: 'blur(2px)' }}
        onClick={openModal}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
        >
          <Lock size={20} style={{ color: '#A78BFA' }} />
        </div>
        <div className="text-center px-4">
          <p className="text-[13px] font-bold text-white">Disponible en Plan {requiredPlan}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Haz clic para ver los planes</p>
        </div>
        <button
          className="px-4 py-2 rounded-lg text-[12px] font-bold transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#fff' }}
        >
          Ver planes
        </button>
      </div>
    </div>
  );
}
