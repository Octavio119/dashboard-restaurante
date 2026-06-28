import { useState } from 'react';
import { Check, Circle, X } from 'lucide-react';

// ─── OnboardingBanner ──────────────────────────────────────────────────────────
// Banner persistente (no bloqueante, a diferencia de OnboardingWizard) en el
// TOP del dashboard mientras el restaurante no completó los 3 pasos. Solo
// navega a páginas/tabs que ya existen — no duplica ningún formulario de
// creación, esos viven en MenuPage/ConfiguracionPage/PedidosPage.
// Esta app no usa rutas URL para la navegación interna (todo es estado en
// App.jsx vía nav.activeTab / cfg.configTab), así que los "links" de cada
// paso son callbacks que cambian ese estado, no <a href>.
export default function OnboardingBanner({ user, status, setActiveTab, setConfigTab }) {
  const dismissKey = `onboarding_banner_dismissed_${user?.restaurante_id}`;
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(dismissKey) === '1');

  if (dismissed) return null;

  const steps = [
    {
      label: 'Crea tu menú',
      done: status.hasMenu,
      onClick: () => { setConfigTab('menu'); setActiveTab('Configuración'); },
    },
    {
      label: 'Configura tus mesas',
      done: status.hasMesas,
      onClick: () => { setConfigTab('negocio'); setActiveTab('Configuración'); },
    },
    {
      label: 'Toma tu primer pedido',
      done: status.hasPedido,
      onClick: () => setActiveTab('Pedidos'),
    },
  ];

  const handleDismiss = () => {
    localStorage.setItem(dismissKey, '1');
    setDismissed(true);
  };

  return (
    <div
      className="relative rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4"
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.16) 0%, rgba(124,58,237,0.05) 100%)',
        border: '1px solid rgba(124,58,237,0.25)',
      }}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-lg transition-colors cursor-pointer"
        style={{ color: '#9CA3AF' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#F8FAFC'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.background = 'transparent'; }}
        aria-label="Cerrar"
        title="Cerrar"
      >
        <X size={16} />
      </button>

      <div className="flex-1 min-w-0">
        <h3 className="text-base font-black tracking-tight" style={{ color: '#F8FAFC' }}>
          Configura tu restaurante en 3 pasos
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3">
          {steps.map((s) => (
            <button
              key={s.label}
              onClick={s.onClick}
              disabled={s.done}
              className="flex items-center gap-2 text-left transition-opacity cursor-pointer disabled:cursor-default"
              style={{ opacity: s.done ? 0.6 : 1 }}
            >
              {s.done
                ? <Check size={16} style={{ color: '#4ADE80' }} />
                : <Circle size={16} style={{ color: '#A78BFA' }} />}
              <span
                className="text-[13px] font-semibold"
                style={{
                  color: s.done ? '#4ADE80' : '#C4B5FD',
                  textDecoration: s.done ? 'line-through' : 'none',
                }}
              >
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
