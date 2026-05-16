import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Zap, CreditCard, X, AlertTriangle } from 'lucide-react';
import { PLANS } from '../../config/plans';

const VARIANTS = {
  PLAN_LIMIT:          { icon: Lock,          color: '#8B5CF6', title: 'Feature no disponible en tu plan' },
  ORDER_LIMIT_REACHED: { icon: Zap,           color: '#F59E0B', title: 'Límite de órdenes alcanzado' },
  PAYMENT_REQUIRED:    { icon: CreditCard,    color: '#EF4444', title: 'Pago requerido' },
  GENERIC:             { icon: AlertTriangle, color: '#F59E0B', title: 'Acción no disponible' },
};

/**
 * Modal global de upgrade. Se instancia en AppLayout y escucha eventos de window:
 *  - 'plan:upgrade_required'  → { type, feature, requiredPlan, currentPlan, message }
 *  - 'plan:order_limit'       → { used, limit }
 *  - 'plan:payment_required'  → { plan_status, message }
 *
 * También se puede abrir directamente pasando `open` y `detail` como props.
 */
export function PlanUpgradeModal({ open: propOpen, detail: propDetail, onClose: propOnClose }) {
  const [state, setState] = useState({ open: false, detail: null });

  const close = useCallback(() => {
    setState({ open: false, detail: null });
    propOnClose?.();
  }, [propOnClose]);

  // Listen to global events
  useEffect(() => {
    const onUpgrade = (e) => setState({ open: true, detail: { type: 'PLAN_LIMIT',          ...e.detail } });
    const onLimit   = (e) => setState({ open: true, detail: { type: 'ORDER_LIMIT_REACHED', ...e.detail } });
    const onPayment = (e) => setState({ open: true, detail: { type: 'PAYMENT_REQUIRED',    ...e.detail } });

    window.addEventListener('plan:upgrade_required',  onUpgrade);
    window.addEventListener('plan:order_limit',       onLimit);
    window.addEventListener('plan:payment_required',  onPayment);
    return () => {
      window.removeEventListener('plan:upgrade_required',  onUpgrade);
      window.removeEventListener('plan:order_limit',       onLimit);
      window.removeEventListener('plan:payment_required',  onPayment);
    };
  }, []);

  const isOpen   = propOpen  ?? state.open;
  const detail   = propDetail ?? state.detail;
  const variant  = VARIANTS[detail?.type] ?? VARIANTS.GENERIC;
  const Icon     = variant.icon;
  const color    = variant.color;

  const requiredPlanKey = detail?.requiredPlan ?? 'pro';
  const planInfo        = PLANS[requiredPlanKey] ?? PLANS.pro;
  const isPaymentIssue  = detail?.type === 'PAYMENT_REQUIRED';
  const isOrderLimit    = detail?.type === 'ORDER_LIMIT_REACHED';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={close}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <motion.div
            className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: '#0F0F1A', border: `1px solid ${color}30` }}
            initial={{ scale: 0.95, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={close}
              className="absolute right-4 top-4 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: `${color}15`, border: `1px solid ${color}30` }}
            >
              <Icon size={22} style={{ color }} />
            </div>

            <h3 className="text-[17px] font-bold text-white mb-1.5">{variant.title}</h3>

            {/* Dynamic message */}
            {isPaymentIssue && (
              <p className="text-[13px] text-zinc-400 mb-5 leading-relaxed">
                {detail?.message ?? 'Tu suscripción tiene un problema de pago. Actualiza tu método de pago para continuar usando todas las funciones.'}
              </p>
            )}
            {isOrderLimit && (
              <p className="text-[13px] text-zinc-400 mb-5 leading-relaxed">
                Usaste <strong className="text-white">{detail?.used}/{detail?.limit}</strong> órdenes este mes.
                El plan Starter incluye {detail?.limit} órdenes/mes.
                Mejora a Pro para órdenes ilimitadas.
              </p>
            )}
            {!isPaymentIssue && !isOrderLimit && (
              <p className="text-[13px] text-zinc-400 mb-5 leading-relaxed">
                {detail?.feature
                  ? <>La función <strong className="text-white">{detail.feature}</strong> está disponible en el plan <strong style={{ color }}>{planInfo.name}</strong>.</>
                  : <>Esta función no está disponible en tu plan actual.</>
                }
              </p>
            )}

            {/* Plan card */}
            {!isPaymentIssue && (
              <div
                className="rounded-xl p-4 mb-5"
                style={{ background: `${color}08`, border: `1px solid ${color}20` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-bold" style={{ color }}>{planInfo.name}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{planInfo.label}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[22px] font-black text-white">${planInfo.price}</div>
                    <div className="text-[11px] text-zinc-500">USD/mes</div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={close}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Ahora no
              </button>
              <a
                href="/billing"
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-center transition-opacity hover:opacity-90 cursor-pointer"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)`, color: '#fff' }}
                onClick={close}
              >
                {isPaymentIssue ? 'Actualizar pago' : `Mejorar a ${planInfo.name}`}
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Dispatch helpers — call from anywhere to trigger the modal. */
export const showUpgradeModal  = (detail) => window.dispatchEvent(new CustomEvent('plan:upgrade_required',  { detail }));
export const showOrderLimit    = (detail) => window.dispatchEvent(new CustomEvent('plan:order_limit',       { detail }));
export const showPaymentModal  = (detail) => window.dispatchEvent(new CustomEvent('plan:payment_required',  { detail }));
