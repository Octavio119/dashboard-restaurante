import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Check, Zap, Building2, Star } from 'lucide-react';

const PLANES = [
  {
    key:     'free',
    nombre:  'Starter',
    precio:  'Gratis',
    color:   'border-gray-200',
    badge:   'bg-gray-100 text-gray-600',
    icon:    Star,
    features: [
      '50 órdenes / mes',
      '2 usuarios',
      '1 local',
      'Sin WebSocket (polling)',
      'Sin analytics',
      'Sin alertas email',
      'Sin PDF',
    ],
  },
  {
    key:       'pro',
    nombre:    'Pro',
    precio:    '$29',
    periodo:   '/ mes',
    color:     'border-amber-400 ring-2 ring-amber-400',
    badge:     'bg-amber-100 text-amber-700',
    icon:      Zap,
    popular:   true,
    features: [
      'Órdenes ilimitadas',
      'Usuarios ilimitados',
      '1 local',
      'WebSocket en tiempo real',
      'Analytics completo',
      'Alertas stock por email',
      'Tickets en PDF',
    ],
  },
  {
    key:     'business',
    nombre:  'Business',
    precio:  '$79',
    periodo: '/ mes',
    color:   'border-purple-400',
    badge:   'bg-purple-100 text-purple-700',
    icon:    Building2,
    features: [
      'Todo lo de Pro',
      'Hasta 5 locales',
      'Dashboard multi-local',
      'API Keys de acceso',
      'Soporte prioritario',
    ],
  },
];

export default function BillingPage() {
  const [usage,    setUsage]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [upgrading, setUpgrading] = useState('');

  useEffect(() => {
    api.getBillingUsage()
      .then(setUsage)
      .catch(() => {})
      .finally(() => setLoading(false));

    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      setTimeout(() => api.getBillingUsage().then(setUsage).catch(() => {}), 2000);
    }
  }, []);

  async function handleUpgrade(planKey) {
    try {
      setUpgrading(planKey);
      const { url } = await api.createCheckout(planKey);
      window.location.href = url;
    } catch (e) {
      alert(e.message || 'Error al iniciar el pago');
    } finally {
      setUpgrading('');
    }
  }

  async function handlePortal() {
    try {
      const { url } = await api.getBillingPortal();
      window.location.href = url;
    } catch (e) {
      alert(e.message || 'Error al abrir el portal');
    }
  }

  const planActual = usage?.plan || 'free';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Cargando...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Planes y facturación</h1>
        <p className="text-gray-500 text-sm">
          Plan actual:{' '}
          <span className="font-semibold capitalize text-gray-800">{planActual}</span>
        </p>
      </div>

      {/* Barra de uso (solo free) */}
      {usage && planActual === 'free' && usage.ordenes_limite && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex justify-between text-sm font-medium text-amber-800 mb-2">
            <span>Órdenes este mes</span>
            <span>{usage.ordenes_usadas} / {usage.ordenes_limite}</span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                usage.porcentaje >= 90 ? 'bg-red-500' :
                usage.porcentaje >= 70 ? 'bg-orange-400' : 'bg-amber-400'
              }`}
              style={{ width: `${Math.min(usage.porcentaje, 100)}%` }}
            />
          </div>
          {usage.porcentaje >= 80 && (
            <p className="text-xs text-amber-700 mt-2">
              Mejora tu plan para seguir operando sin interrupciones.
            </p>
          )}
        </div>
      )}

      {/* Cards de planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {PLANES.map((plan) => {
          const Icon    = plan.icon;
          const actual  = planActual === plan.key;
          const esGratis = plan.key === 'free';

          return (
            <div
              key={plan.key}
              className={`relative rounded-2xl border-2 bg-white p-6 flex flex-col ${plan.color} ${actual ? 'shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MÁS POPULAR
                  </span>
                </div>
              )}

              <div className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full mb-4 self-start ${plan.badge}`}>
                <Icon size={12} />
                {plan.nombre}
              </div>

              <div className="mb-5">
                <span className="text-3xl font-bold text-gray-900">{plan.precio}</span>
                {plan.periodo && <span className="text-gray-400 text-sm ml-1">{plan.periodo}</span>}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {actual ? (
                <div className="text-center text-sm font-medium text-gray-400 py-2 border border-gray-200 rounded-lg">
                  Plan actual
                </div>
              ) : esGratis ? (
                <div className="text-center text-sm text-gray-400 py-2">—</div>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={!!upgrading}
                  className="w-full py-2.5 rounded-lg font-semibold text-sm bg-amber-400 hover:bg-amber-500 text-white transition disabled:opacity-60"
                >
                  {upgrading === plan.key ? 'Redirigiendo...' : `Upgrade a ${plan.nombre}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Portal de facturación (solo planes de pago) */}
      {planActual !== 'free' && (
        <div className="text-center">
          <button
            onClick={handlePortal}
            className="text-sm text-gray-500 underline hover:text-gray-800 transition"
          >
            Gestionar suscripción y facturas
          </button>
        </div>
      )}
    </div>
  );
}
