import { useState } from 'react';

const CHECK = 'M5 13l4 4L19 7';
const font  = "'Plus Jakarta Sans', -apple-system, sans-serif";

function Check({ color }) {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2.5}
      style={{ flexShrink: 0, marginTop: 2 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d={CHECK} />
    </svg>
  );
}

const PLANS = [
  {
    key:      'free',
    nombre:   'Starter',
    tagline:  'Para probar sin comprometerte',
    badge:    null,
    precio:   { mensual: 0, anual: 0 },
    esGratis: true,
    features: [
      '50 órdenes / mes',
      '2 usuarios',
      'Pedidos y gestión de mesas',
      '1 local',
    ],
    cta:      'Empezar gratis',
    href:     '/register',
    accent:   '#64748b',
    card: {
      border:     '1.5px solid #e2e8f0',
      background: '#ffffff',
      shadow:     '0 1px 4px rgba(0,0,0,0.04)',
      shadowHover:'0 8px 32px rgba(0,0,0,0.08)',
    },
    btn: {
      bg:      'transparent',
      bgHover: '#f8fafc',
      border:  '1.5px solid #cbd5e1',
      color:   '#374151',
    },
  },
  {
    key:      'pro',
    nombre:   'Pro',
    tagline:  'Para restaurantes en operación',
    badge:    'Más popular',
    precio:   { mensual: 29, anual: 23 },
    esGratis: false,
    popular:  true,
    features: [
      'Órdenes ilimitadas',
      'Usuarios ilimitados',
      'Analytics completo',
      'WebSocket en tiempo real',
      'Alertas de stock por email',
      'Tickets en PDF',
    ],
    cta:     'Empezar Pro — 14 días gratis',
    href:    '/register?plan=pro',
    accent:  '#0066CC',
    card: {
      border:     '1.5px solid rgba(0,102,204,0.6)',
      background: 'linear-gradient(180deg, rgba(0,102,204,0.035) 0%, #ffffff 60%)',
      shadow:     '0 0 0 1px rgba(0,102,204,0.15), 0 8px 40px rgba(0,102,204,0.12)',
      shadowHover:'0 0 0 1px rgba(0,102,204,0.35), 0 20px 56px rgba(0,102,204,0.22)',
    },
    btn: {
      bg:      '#0066CC',
      bgHover: '#0052a3',
      border:  '1.5px solid #0066CC',
      color:   '#ffffff',
    },
  },
  {
    key:      'business',
    nombre:   'Business',
    tagline:  'Para cadenas y grupos gastronómicos',
    badge:    'Multi-local',
    precio:   { mensual: 79, anual: 63 },
    esGratis: false,
    features: [
      'Todo lo de Pro',
      'Hasta 5 locales',
      'Dashboard global multi-local',
      'API Keys de acceso',
      'Soporte prioritario',
      'Onboarding personalizado',
    ],
    cta:     'Contactar ventas',
    href:    '/register?plan=business',
    accent:  '#7c3aed',
    card: {
      border:     '1.5px solid rgba(124,58,237,0.5)',
      background: 'linear-gradient(180deg, rgba(124,58,237,0.03) 0%, #ffffff 60%)',
      shadow:     '0 0 0 1px rgba(124,58,237,0.12), 0 8px 40px rgba(124,58,237,0.10)',
      shadowHover:'0 0 0 1px rgba(124,58,237,0.30), 0 20px 56px rgba(124,58,237,0.18)',
    },
    btn: {
      bg:      '#7c3aed',
      bgHover: '#6d28d9',
      border:  '1.5px solid #7c3aed',
      color:   '#ffffff',
    },
  },
];

function PlanCard({ plan, anual }) {
  const [hovered, setHovered] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  const precio = plan.precio[anual ? 'anual' : 'mensual'];
  const { card, btn } = plan;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:      'relative',
        display:       'flex',
        flexDirection: 'column',
        background:    card.background,
        border:        card.border,
        borderRadius:  '20px',
        padding:       '32px 28px',
        boxShadow:     hovered ? card.shadowHover : card.shadow,
        transform:     hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition:    'transform 0.22s ease, box-shadow 0.22s ease',
        fontFamily:    font,
      }}
    >
      {/* Badge superior */}
      {plan.badge && (
        <div style={{
          position:      'absolute',
          top:           '-13px',
          left:          '50%',
          transform:     'translateX(-50%)',
          background:    plan.accent,
          color:         '#fff',
          fontSize:      '11px',
          fontWeight:    700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          padding:       '4px 14px',
          borderRadius:  '99px',
          whiteSpace:    'nowrap',
          boxShadow:     `0 2px 12px ${plan.accent}44`,
        }}>
          {plan.badge}
        </div>
      )}

      {/* Header del plan */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{
          fontSize:      '11px',
          fontWeight:    600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color:         plan.badge ? plan.accent : '#94a3b8',
          marginBottom:  '6px',
        }}>
          {plan.nombre}
        </p>

        {plan.esGratis ? (
          <p style={{ fontSize: '40px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
            Gratis
          </p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ fontSize: '40px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              ${precio}
            </span>
            <span style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>/ mes</span>
          </div>
        )}

        {!plan.esGratis && anual && (
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            Facturado ${precio * 12} / año
          </p>
        )}

        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>{plan.tagline}</p>
      </div>

      {/* Separador */}
      <div style={{ height: '1px', background: '#f1f5f9', marginBottom: '20px' }} />

      {/* Features */}
      <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, marginBottom: '28px', padding: 0, listStyle: 'none' }}>
        {plan.features.map((f) => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '13.5px', color: '#374151' }}>
            <Check color={plan.accent} />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <a
        href={plan.href}
        onMouseEnter={() => setBtnHover(true)}
        onMouseLeave={() => setBtnHover(false)}
        style={{
          display:        'block',
          width:          '100%',
          textAlign:      'center',
          padding:        '11px 20px',
          borderRadius:   '10px',
          background:     btnHover ? btn.bgHover : btn.bg,
          border:         btn.border,
          color:          btn.color,
          fontFamily:     font,
          fontSize:       '13.5px',
          fontWeight:     600,
          textDecoration: 'none',
          transition:     'background 0.15s ease, transform 0.1s ease',
          transform:      btnHover ? 'translateY(-1px)' : 'none',
          letterSpacing:  '-0.01em',
          boxSizing:      'border-box',
        }}
      >
        {plan.cta}
      </a>
    </div>
  );
}

export default function PricingCards({ className = '' }) {
  const [anual, setAnual] = useState(false);

  return (
    <section className={`w-full ${className}`} style={{ fontFamily: font }}>

      {/* Toggle mensual / anual */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '40px' }}>
        <span style={{ fontSize: '13.5px', fontWeight: 500, color: !anual ? '#0f172a' : '#94a3b8' }}>
          Mensual
        </span>
        <button
          onClick={() => setAnual((v) => !v)}
          aria-label="Cambiar período de facturación"
          style={{
            position:   'relative',
            width:      '44px',
            height:     '24px',
            borderRadius: '99px',
            background: anual ? '#0066CC' : '#e2e8f0',
            border:     'none',
            cursor:     'pointer',
            transition: 'background 0.2s ease',
            outline:    'none',
          }}
        >
          <span style={{
            position:   'absolute',
            top:        '4px',
            left:       anual ? '24px' : '4px',
            width:      '16px',
            height:     '16px',
            borderRadius: '50%',
            background: '#fff',
            boxShadow:  '0 1px 3px rgba(0,0,0,0.15)',
            transition: 'left 0.2s ease',
          }} />
        </button>
        <span style={{ fontSize: '13.5px', fontWeight: 500, color: anual ? '#0f172a' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Anual
          <span style={{
            fontSize:   '11px',
            fontWeight: 700,
            color:      '#0066CC',
            background: 'rgba(0,102,204,0.08)',
            padding:    '2px 7px',
            borderRadius: '99px',
          }}>
            −20%
          </span>
        </span>
      </div>

      {/* Grid de cards */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap:                 '20px',
        alignItems:          'start',
      }}>
        {PLANS.map((plan) => (
          <PlanCard key={plan.key} plan={plan} anual={anual} />
        ))}
      </div>

      {/* Pie */}
      <p style={{ textAlign: 'center', fontSize: '12.5px', color: '#94a3b8', marginTop: '28px' }}>
        🔒 Sin tarjeta de crédito para Starter · Garantía 14 días · Cancela cuando quieras
      </p>
    </section>
  );
}
