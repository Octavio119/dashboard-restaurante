import { useEffect, useRef, useState } from 'react';
import { api } from '../api';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
const PAYPAL_MODE      = import.meta.env.VITE_PAYPAL_MODE || 'sandbox';
const SDK_URL          = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&locale=es_CL`;

function loadPayPalSDK() {
  return new Promise((resolve, reject) => {
    if (window.paypal) { resolve(window.paypal); return; }
    if (document.getElementById('paypal-sdk')) {
      // Script ya está en el DOM pero aún cargando — esperar
      document.getElementById('paypal-sdk').addEventListener('load', () => resolve(window.paypal));
      document.getElementById('paypal-sdk').addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id  = 'paypal-sdk';
    script.src = SDK_URL;
    script.setAttribute('data-sdk-integration-source', 'button-factory');
    script.onload  = () => resolve(window.paypal);
    script.onerror = () => reject(new Error('No se pudo cargar el SDK de PayPal'));
    document.head.appendChild(script);
  });
}

/**
 * PayPalButton — integración real con PayPal JS SDK
 *
 * Props:
 *   plan        — 'pro' | 'business'
 *   onSuccess   — callback({ plan }) cuando el pago se confirma en el backend
 *   onError     — callback(errorMessage) cuando algo falla
 *   disabled    — deshabilita el botón mientras se procesa algo externo
 */
export default function PayPalButton({ plan, onSuccess, onError, disabled = false }) {
  const containerRef = useRef(null);
  const buttonsRef   = useRef(null);
  const [sdkState, setSdkState] = useState('loading'); // 'loading' | 'ready' | 'error'

  useEffect(() => {
    if (!PAYPAL_CLIENT_ID) {
      setSdkState('error');
      onError?.('VITE_PAYPAL_CLIENT_ID no está configurado');
      return;
    }

    let mounted = true;

    loadPayPalSDK()
      .then((paypal) => {
        if (!mounted || !containerRef.current) return;
        setSdkState('ready');

        // Limpiar instancia anterior si hay hot-reload o cambio de plan
        if (buttonsRef.current) {
          buttonsRef.current.close();
          buttonsRef.current = null;
        }
        containerRef.current.innerHTML = '';

        buttonsRef.current = paypal.Buttons({
          style: {
            layout:  'vertical',
            color:   'blue',
            shape:   'rect',
            label:   'pay',
            height:  48,
          },

          // ─── 1. Crear orden en el backend ─────────────────────────────────
          // El backend genera la orden en PayPal con el plan y restaurante_id
          // correctos. El orderId viaja dentro del objeto de la orden (custom_id).
          createOrder: async () => {
            try {
              const { orderId } = await api.createCheckout(plan);
              if (!orderId) throw new Error('El servidor no devolvió un orderId');
              return orderId;
            } catch (e) {
              const msg = e?.message || 'Error al crear la orden de pago';
              onError?.(msg);
              throw e; // PayPal necesita que se lance el error para abortar
            }
          },

          // ─── 2. Capturar el pago cuando el usuario aprueba ────────────────
          // NO marcamos el pago como exitoso aquí — solo cuando el backend confirma.
          onApprove: async (data) => {
            try {
              const result = await api.captureCheckout(data.orderID);
              if (!result?.ok) throw new Error(result?.error || 'El pago no fue confirmado');
              onSuccess?.({ plan: result.plan });
            } catch (e) {
              const msg = e?.message || 'Error al confirmar el pago con el servidor';
              onError?.(msg);
            }
          },

          // ─── 3. Usuario canceló en el modal de PayPal ─────────────────────
          onCancel: () => {
            onError?.('Pago cancelado. Puedes intentarlo de nuevo cuando quieras.');
          },

          // ─── 4. Error interno del SDK de PayPal ───────────────────────────
          onError: (err) => {
            console.error('[PayPal SDK error]', err);
            onError?.('Ocurrió un error con PayPal. Intenta de nuevo o usa otro método de pago.');
          },
        });

        if (buttonsRef.current.isEligible()) {
          buttonsRef.current.render(containerRef.current);
        } else {
          setSdkState('error');
          onError?.('PayPal no está disponible en este navegador o región.');
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setSdkState('error');
        onError?.(err?.message || 'No se pudo inicializar PayPal');
      });

    return () => {
      mounted = false;
      if (buttonsRef.current) {
        buttonsRef.current.close?.();
        buttonsRef.current = null;
      }
    };
  }, [plan]); // Re-renderizar si cambia el plan

  if (sdkState === 'loading') {
    return (
      <div style={{
        height: '48px', borderRadius: '6px', background: '#f0f4ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '8px', color: '#64748b', fontSize: '13px',
      }}>
        <svg width="16" height="16" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}
          fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#0066CC" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Cargando PayPal...
      </div>
    );
  }

  if (sdkState === 'error') {
    return (
      <div style={{
        padding: '12px', borderRadius: '8px', background: '#fef2f2',
        border: '1px solid #fca5a5', color: '#dc2626', fontSize: '13px', textAlign: 'center',
      }}>
        No se pudo cargar PayPal. Recarga la página e intenta de nuevo.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Overlay para deshabilitar los botones externamente */}
      {disabled && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: 'rgba(255,255,255,0.7)', cursor: 'not-allowed',
          borderRadius: '6px',
        }} />
      )}
      <div ref={containerRef} />
    </div>
  );
}
