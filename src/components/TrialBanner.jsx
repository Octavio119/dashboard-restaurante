import { usePlan } from '../hooks/usePlan';
import { ShineBorder } from './ui/shine-border';

export default function TrialBanner() {
  const { isTrial, trialDaysLeft, trialExpired } = usePlan();

  if (!isTrial || trialDaysLeft === null || trialDaysLeft > 3) return null;

  const textColor   = trialExpired ? '#EF4444' : '#F59E0B';
  const borderColor = trialExpired ? 'rgba(239,68,68,.3)' : 'rgba(245,158,11,.3)';
  const bgColor     = trialExpired ? 'rgba(239,68,68,.08)' : 'rgba(245,158,11,.08)';

  const message = trialExpired
    ? 'Tu período de prueba venció.'
    : trialDaysLeft === 1
      ? 'Tu período de prueba vence hoy.'
      : `Tu período de prueba vence en ${trialDaysLeft} días.`;

  return (
    <ShineBorder
      color={[textColor, '#F59E0B', '#EF4444']}
      borderWidth={1}
      className="mx-4 mb-3 rounded-[10px]"
    >
      <div
        className="flex items-center justify-between gap-3 rounded-[10px] border px-4 py-3 text-sm w-full"
        style={{ background: bgColor, borderColor }}
      >
        <span className="font-medium" style={{ color: textColor }}>{message}</span>
        <a
          href="/billing"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold shrink-0"
          style={{ background: textColor, color: '#0A0A12' }}
        >
          Elegir plan
        </a>
      </div>
    </ShineBorder>
  );
}
