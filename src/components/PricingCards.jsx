import { useState } from 'react';

const CHECK_PATH = 'M5 13l4 4L19 7';

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={CHECK_PATH} />
    </svg>
  );
}

const PLANS = [
  {
    key:       'free',
    nombre:    'Starter',
    badge:     'Gratis para siempre',
    badgeStyle:'bg-gray-100 text-gray-500',
    precio:    { mensual: 0, anual: 0 },
    features: [
      '50 órdenes / mes',
      '2 usuarios',
      'Pedidos y mesas',
      '1 local',
    ],
    cta:       'Empezar gratis',
    href:      '/register',
    ctaStyle:  'border border-gray-300 text-gray-700 hover:bg-gray-50',
    cardStyle: 'border border-gray-200 bg-white',
    scale:     false,
  },
  {
    key:       'pro',
    nombre:    'Pro',
    badge:     'Más popular',
    badgeStyle:'bg-green-100 text-green-700 font-bold',
    precio:    { mensual: 29, anual: 23 },
    popular:   true,
    features: [
      'Órdenes ilimitadas',
      'Usuarios ilimitados',
      'Analytics completo',
      'WebSocket en tiempo real',
      'Alertas de stock por email',
      'Tickets en PDF',
    ],
    cta:       'Empezar Pro',
    href:      '/register?plan=pro',
    ctaStyle:  'bg-green-600 hover:bg-green-700 text-white',
    cardStyle: 'border-2 border-green-500 bg-white shadow-lg shadow-green-100',
    scale:     true,
  },
  {
    key:       'business',
    nombre:    'Business',
    badge:     'Multi-local',
    badgeStyle:'bg-gray-900 text-gray-100',
    precio:    { mensual: 79, anual: 63 },
    features: [
      'Todo lo de Pro',
      'Hasta 5 locales',
      'Dashboard global multi-local',
      'API Keys de acceso',
      'Soporte prioritario',
    ],
    cta:       'Contactar ventas',
    href:      '/register?plan=business',
    ctaStyle:  'border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white',
    cardStyle: 'border-2 border-gray-800 bg-white',
    scale:     false,
  },
];

export default function PricingCards({ className = '' }) {
  const [anual, setAnual] = useState(false);

  return (
    <section className={`w-full ${className}`}>

      {/* Toggle anual/mensual */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm font-medium ${!anual ? 'text-gray-900' : 'text-gray-400'}`}>
          Mensual
        </span>
        <button
          onClick={() => setAnual((v) => !v)}
          aria-label="Cambiar período de facturación"
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
            anual ? 'bg-green-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
              anual ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${anual ? 'text-gray-900' : 'text-gray-400'}`}>
          Anual
          <span className="ml-1.5 text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
            −20%
          </span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {PLANS.map((plan) => {
          const precio   = plan.precio[anual ? 'anual' : 'mensual'];
          const esGratis = plan.key === 'free';

          return (
            <div
              key={plan.key}
              className={`relative flex flex-col rounded-2xl p-7 transition-transform duration-200 ${plan.cardStyle} ${
                plan.scale ? 'md:scale-[1.03]' : ''
              }`}
            >
              {/* Badge */}
              <div className="mb-5">
                <span className={`inline-block text-xs px-3 py-1 rounded-full ${plan.badgeStyle}`}>
                  {plan.badge}
                </span>
              </div>

              {/* Nombre + precio */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.nombre}</h3>
                {esGratis ? (
                  <p className="text-3xl font-extrabold text-gray-900">Gratis</p>
                ) : (
                  <p className="text-3xl font-extrabold text-gray-900">
                    ${precio}
                    <span className="text-base font-normal text-gray-400 ml-1">/ mes</span>
                  </p>
                )}
                {!esGratis && anual && (
                  <p className="text-xs text-gray-400 mt-1">
                    Facturado ${precio * 12} anualmente
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={plan.href}
                className={`block w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors duration-150 ${plan.ctaStyle}`}
              >
                {plan.cta}
              </a>
            </div>
          );
        })}
      </div>

      {/* Texto inferior */}
      <p className="text-center text-xs text-gray-400 mt-7">
        Sin tarjeta de crédito para Starter · Cancela cuando quieras
      </p>
    </section>
  );
}
