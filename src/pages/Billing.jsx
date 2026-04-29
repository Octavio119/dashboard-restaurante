import { useEffect, useState } from 'react';
import { api } from '../api';
import { Check, Zap, Building2, Star, ArrowLeft } from 'lucide-react';

const PLANES = [
  {
    key:      'free',
    nombre:   'Starter',
    precio:   'Gratis',
    color:    'border-gray-200',
    badge:    'bg-gray-100 text-gray-600',
    icon:     Star,
    features: [
      '50 órdenes / mes',
      '2 usuarios',
      '1 local',
      'Pedidos y mesas',
      'Soporte por email',
    ],
  },
  {
    key:      'pro',
    nombre:   'Pro',
    precio:   '$29',
    periodo:  '/ mes',
    color:    'border-[#0066CC] ring-2 ring-[#0066CC]/30',
    badge:    'bg-blue-50 text-blue-700',
    icon:     Zap,
    popular:  true,
    features: [
      'Órdenes ilimitadas',
      'Usuarios ilimitados',
      'WebSocket en tiempo real',
      'Analytics completo',
      'Alertas stock por email',
      'Tickets en PDF',
      'Soporte 24/7',
    ],
  },
  {
    key:      'business',
    nombre:   'Business',
    precio:   '$79',
    periodo:  '/ mes',
    color:    'border-purple-400',
    badge:    'bg-purple-50 text-purple-700',
    icon:     Building2,
    features: [
      'Todo lo de Pro',
      'Hasta 5 locales',
      'Dashboard multi-local',
      'API Keys de acceso',
      'Onboarding con especialista',
      'SLA de soporte dedicado',
    ],
  },
];

export default function Billing() {
  const [usage,     setUsage]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [upgrading, setUpgrading] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [banner,    setBanner]    = useState(null); // { type: 'success'|'warning'|'error', msg }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      setBanner({ type: 'success', msg: '¡Plan actualizado con éxito! Tu cuenta ya tiene acceso a las nuevas funciones.' });
      window.history.replaceState({}, '', window.location.pathname);
      // Refrescar usage tras unos segundos para reflejar el plan nuevo
      setTimeout(() => api.getBillingUsage().then(setUsage).catch(() => {}), 1500);
    } else if (params.get('cancelled') === 'true') {
      setBanner({ type: 'warning', msg: 'El pago fue cancelado. Puedes intentarlo de nuevo cuando quieras.' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('error')) {
      setBanner({ type: 'error', msg: 'Hubo un problema con el pago. Intenta de nuevo o contacta soporte.' });
      window.history.replaceState({}, '', window.location.pathname);
    }

    api.getBillingUsage()
      .then(setUsage)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(planKey) {
    setUpgrading(planKey);
    try {
      const { url } = await api.createCheckout(planKey);
      window.location.href = url;
    } catch (e) {
      setBanner({ type: 'error', msg: e.message || 'Error al iniciar el pago. Intenta de nuevo.' });
      setUpgrading('');
    }
  }

  async function handleCancel() {
    if (!window.confirm('¿Seguro que deseas cancelar tu suscripción? Tu plan pasará a Starter.')) return;
    setCancelling(true);
    try {
      await fetch('/api/billing/cancel', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setBanner({ type: 'success', msg: 'Suscripción cancelada. Tu plan volvió a Starter.' });
      api.getBillingUsage().then(setUsage).catch(() => {});
    } catch (e) {
      setBanner({ type: 'error', msg: 'Error al cancelar la suscripción.' });
    } finally {
      setCancelling(false);
    }
  }

  const planActual = usage?.plan || 'free';

  const bannerStyles = {
    success: { bg: '#f0fdf4', border: '#86efac', color: '#166534', icon: '✅' },
    warning: { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', icon: '⚠️' },
    error:   { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b', icon: '❌' },
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#64748b' }}>
          <svg width="24" height="24" style={{ animation: 'spin 0.8s linear infinite' }} fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#0066CC" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: '14px' }}>Cargando planes...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
          <ArrowLeft size={15} /> Volver al dashboard
        </a>
        <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }} />
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Planes y facturación</h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            Plan actual: <strong style={{ color: '#0D1B3E', textTransform: 'capitalize' }}>{planActual}</strong>
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Banner de estado */}
        {banner && (() => {
          const s = bannerStyles[banner.type];
          return (
            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: '10px',
              padding: '14px 18px', marginBottom: '24px',
              display: 'flex', alignItems: 'flex-start', gap: '10px', color: s.color, fontSize: '14px',
            }}>
              <span>{s.icon}</span>
              <span style={{ fontWeight: 500 }}>{banner.msg}</span>
              <button onClick={() => setBanner(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: s.color, fontSize: '16px', lineHeight: 1 }}>×</button>
            </div>
          );
        })()}

        {/* Barra de uso — plan free */}
        {usage && planActual === 'free' && usage.ordenes_limite && (
          <div style={{
            background: usage.porcentaje >= 90 ? '#fef2f2' : usage.porcentaje >= 70 ? '#fffbeb' : '#f0fdf4',
            border: `1px solid ${usage.porcentaje >= 90 ? '#fca5a5' : usage.porcentaje >= 70 ? '#fcd34d' : '#86efac'}`,
            borderRadius: '10px', padding: '16px 20px', marginBottom: '28px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                Órdenes este mes
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: usage.porcentaje >= 90 ? '#dc2626' : usage.porcentaje >= 70 ? '#d97706' : '#16a34a' }}>
                {usage.ordenes_usadas} / {usage.ordenes_limite} ({usage.porcentaje}%)
              </span>
            </div>
            <div style={{ background: '#e2e8f0', borderRadius: '100px', height: '8px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '100px',
                background: usage.porcentaje >= 90 ? '#ef4444' : usage.porcentaje >= 70 ? '#f59e0b' : '#22c55e',
                width: `${Math.min(usage.porcentaje, 100)}%`,
                transition: 'width 0.5s ease',
              }} />
            </div>
            {usage.porcentaje >= 80 && (
              <p style={{ marginTop: '8px', fontSize: '12px', color: usage.porcentaje >= 90 ? '#dc2626' : '#d97706' }}>
                Estás cerca del límite. Mejora tu plan para operar sin interrupciones.
              </p>
            )}
          </div>
        )}

        {/* Título sección */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0D1B3E', margin: '0 0 6px' }}>
            Elige el plan para tu restaurante
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            Sin contratos. Cancela cuando quieras.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {PLANES.map((plan) => {
            const Icon   = plan.icon;
            const actual = planActual === plan.key;

            return (
              <div key={plan.key} style={{
                position: 'relative',
                background: '#fff',
                border: actual ? '2px solid #0066CC' : '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: actual ? '0 4px 20px rgba(0,102,204,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)',
                    background: '#0066CC', color: '#fff', fontSize: '10px', fontWeight: 700,
                    letterSpacing: '0.06em', padding: '3px 12px', borderRadius: '100px',
                    whiteSpace: 'nowrap',
                  }}>
                    MÁS POPULAR
                  </div>
                )}

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '100px', marginBottom: '16px', width: 'fit-content', background: plan.key === 'free' ? '#f1f5f9' : plan.key === 'pro' ? '#eff6ff' : '#faf5ff', color: plan.key === 'free' ? '#475569' : plan.key === 'pro' ? '#1d4ed8' : '#7c3aed' }}>
                  <Icon size={12} />
                  {plan.nombre}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{plan.precio}</span>
                  {plan.periodo && <span style={{ fontSize: '13px', color: '#94a3b8', marginLeft: '4px' }}>{plan.periodo}</span>}
                </div>

                <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', padding: 0, listStyle: 'none' }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#475569' }}>
                      <Check size={14} style={{ color: '#22c55e', marginTop: '2px', flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {actual ? (
                  <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#0066CC', padding: '10px', border: '1.5px solid #bfdbfe', borderRadius: '8px', background: '#eff6ff' }}>
                    ✓ Plan actual
                  </div>
                ) : plan.key === 'free' ? (
                  <div style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', padding: '10px' }}>
                    Plan gratuito
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.key)}
                    disabled={!!upgrading}
                    style={{
                      width: '100%', height: '42px', borderRadius: '8px',
                      background: upgrading === plan.key ? '#94a3b8' : plan.key === 'pro' ? '#0066CC' : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                      color: '#fff', fontWeight: 700, fontSize: '14px',
                      border: 'none', cursor: upgrading ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.15s',
                      fontFamily: 'inherit',
                    }}
                    onMouseOver={(e) => { if (!upgrading) e.currentTarget.style.opacity = '0.88'; }}
                    onMouseOut={(e)  => { e.currentTarget.style.opacity = '1'; }}
                  >
                    {upgrading === plan.key ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <svg width="14" height="14" style={{ animation: 'spin 0.8s linear infinite' }} fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Redirigiendo a PayPal...
                      </span>
                    ) : `Activar ${plan.nombre}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Cancelar suscripción (solo planes de pago activos) */}
        {planActual !== 'free' && (
          <div style={{ textAlign: 'center', paddingTop: '8px' }}>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              style={{ background: 'none', border: 'none', cursor: cancelling ? 'not-allowed' : 'pointer', color: '#94a3b8', fontSize: '13px', textDecoration: 'underline', fontFamily: 'inherit' }}
            >
              {cancelling ? 'Cancelando...' : 'Cancelar suscripción y volver a Starter'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
