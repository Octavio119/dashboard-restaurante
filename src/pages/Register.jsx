import { useState, useEffect } from 'react';
import { api } from '../api';
import PayPalButton from '../components/PayPalButton';

// ─── Google Font ──────────────────────────────────────────────────────────────
function useFont() {
  useEffect(() => {
    if (document.getElementById('pjs-font')) return;
    const link = document.createElement('link');
    link.id   = 'pjs-font';
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);
}

// ─── Plan config ──────────────────────────────────────────────────────────────
// formColor: contraste ≥ 4.5:1 sobre blanco (WCAG AA) — distinto de accent del panel izquierdo
const PLANS = {
  free: {
    badge:     'Plan Starter',
    badgeBg:   'rgba(0,102,204,0.12)',
    badgeColor:'#0066CC',
    headline:  'Empieza hoy,',
    sub:       'sin gastar nada',
    emColor:   '#5ba8f5',
    price:     '$0',
    priceSub:  'Para siempre gratis',
    features: [
      '50 órdenes / mes',
      '2 usuarios incluidos',
      'Pedidos y gestión de mesas',
      'Acceso desde cualquier dispositivo',
    ],
    guarantee: { icon: '✦', text: 'Sin compromisos · Cambia de plan cuando quieras' },
    bg:        'linear-gradient(160deg, #071525 0%, #0D1B3E 55%, #003060 100%)',
    accent:    '#0066CC',
    btnLabel:  'Crear cuenta gratis',
    btnBg:     '#0066CC',
    btnHover:  '#0052a3',
    btnShadow: '0 4px 16px rgba(0,102,204,0.40)',
    payNote:   null,
    // Panel derecho — color que pasa AA sobre blanco
    formColor: '#0066CC',
    formRgba:  'rgba(0,102,204,0.12)',
  },
  pro: {
    badge:     'Más popular',
    badgeBg:   'rgba(91,168,245,0.15)',
    badgeColor:'#5ba8f5',
    headline:  'El sistema que',
    sub:       'trabaja por ti',
    emColor:   '#5ba8f5',
    price:     '$29',
    priceSub:  '/ mes · cancela cuando quieras',
    features: [
      'Órdenes ilimitadas',
      'Usuarios ilimitados',
      'Analytics en tiempo real',
      'WebSocket + alertas de stock',
      'PDF de tickets · Soporte 24/7',
    ],
    guarantee: { icon: '⬡', text: 'Garantía 14 días · Devolución sin preguntas' },
    bg:        'linear-gradient(155deg, #071525 0%, #0D1B3E 45%, #003060 100%)',
    accent:    '#5ba8f5',
    btnLabel:  'Continuar al pago',
    btnBg:     '#0066CC',
    btnHover:  '#0052a3',
    btnShadow: '0 4px 16px rgba(0,102,204,0.40)',
    payNote:   'Serás redirigido a PayPal de forma segura',
    // Panel derecho — azul oscuro para contraste AA (5.0:1 sobre blanco)
    formColor: '#2563eb',
    formRgba:  'rgba(37,99,235,0.12)',
  },
  business: {
    badge:     'Plan Business',
    badgeBg:   'rgba(192,132,252,0.15)',
    badgeColor:'#c084fc',
    headline:  'Escala tu cadena',
    sub:       'sin límites',
    emColor:   '#c084fc',
    price:     '$79',
    priceSub:  '/ mes · multi-local incluido',
    features: [
      'Todo lo del Plan Pro',
      '5 locales en un dashboard',
      'API REST acceso total',
      'Onboarding con especialista',
      'SLA de soporte dedicado',
    ],
    guarantee: { icon: '◆', text: 'Onboarding gratis · Un especialista te configura todo' },
    bg:        'linear-gradient(155deg, #120820 0%, #1a0e35 50%, #2d1060 100%)',
    accent:    '#c084fc',
    btnLabel:  'Activar Plan Business',
    btnBg:     'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
    btnHover:  '#6d28d9',
    btnShadow: '0 4px 16px rgba(124,58,237,0.45)',
    payNote:   'Serás redirigido a PayPal de forma segura',
    // Panel derecho — púrpura oscuro para contraste AA (4.7:1 sobre blanco)
    formColor: '#7c3aed',
    formRgba:  'rgba(124,58,237,0.12)',
  },
};

function getPlan() {
  const p = new URLSearchParams(window.location.search).get('plan');
  return p === 'pro' || p === 'business' ? p : 'free';
}

// ─── Subcomponents ────────────────────────────────────────────────────────────
function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function CheckIcon({ color }) {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '2px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function StarIcon({ color }) {
  return (
    <svg width="11" height="11" fill={color} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function BuildingIcon({ color }) {
  return (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2} style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

// ─── Field component ──────────────────────────────────────────────────────────
// accentColor/accentRgba son el color del plan activo (contraste AA garantizado)
function Field({ label, optional, type = 'text', value, onChange, placeholder, error, autoComplete, suffix, accentColor = '#0066CC', accentRgba = 'rgba(0,102,204,0.12)' }) {
  const [focused, setFocused] = useState(false);

  const borderColor = error ? '#ef4444' : focused ? accentColor : '#E2EAF4';
  const shadowStyle = focused && !error
    ? `0 0 0 3px ${accentRgba}`
    : error ? '0 0 0 3px rgba(239,68,68,0.10)' : 'none';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', letterSpacing: '-0.01em' }}>
          {label}
        </label>
        {optional && (
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>Opcional</span>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            height: '44px',
            padding: suffix ? '0 42px 0 14px' : '0 14px',
            border: `1.5px solid ${borderColor}`,
            borderRadius: '10px',
            background: error ? '#fff5f5' : '#fff',
            color: '#0f172a',
            fontSize: '14px',
            fontFamily: 'inherit',
            outline: 'none',
            boxShadow: shadowStyle,
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxSizing: 'border-box',
          }}
        />
        {suffix && (
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer' }}>
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ef4444', fontSize: '12px' }}>
          <WarnIcon />
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Register() {
  useFont();
  const planKey = getPlan();
  const plan    = PLANS[planKey];

  const [restaurante, setRestaurante] = useState('');
  const [email,       setEmail]       = useState('');
  const [nombre,      setNombre]      = useState('');
  const [password,    setPassword]    = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [terms,       setTerms]       = useState(false);
  const [errors,      setErrors]      = useState({});
  const [submitErr,   setSubmitErr]   = useState('');
  const [loading,     setLoading]     = useState(false);
  // Flujo de pago: 'form' → usuario llena el form | 'payment' → muestra PayPal SDK
  const [payStep,     setPayStep]     = useState('form');
  const [payError,    setPayError]    = useState('');

  const clearFieldErr = (k) => setErrors((prev) => ({ ...prev, [k]: '' }));

  const validate = () => {
    const e = {};
    if (restaurante.trim().length < 2) e.restaurante = 'Mínimo 2 caracteres';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Ingresa un email válido';
    if (password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (!terms) e.terms = 'Debes aceptar los términos para continuar';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitErr('');
    setPayError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const data = await api.signup(
        restaurante.trim(),
        email.trim().toLowerCase(),
        password,
        nombre.trim() || restaurante.trim(),
      );

      localStorage.setItem('token',         data.token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user',          JSON.stringify(data.user));

      if (planKey !== 'free') {
        // Cuenta creada — mostrar PayPal SDK en lugar de redirigir
        setPayStep('payment');
        return;
      }

      window.location.href = '/dashboard';
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('ya registrado') || msg.includes('409') || msg.includes('Email') || msg.includes('existe')) {
        setSubmitErr('__login__');
      } else if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed')) {
        setSubmitErr('Sin conexión al servidor. Verifica tu internet e intenta de nuevo.');
      } else {
        setSubmitErr(msg || 'Error al crear la cuenta. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  function handlePaySuccess({ plan: activatedPlan }) {
    window.location.href = `/dashboard?upgraded=true&plan=${activatedPlan}`;
  }

  function handlePayError(msg) {
    setPayError(msg || 'Error en el proceso de pago.');
  }

  const steps = planKey === 'free'
    ? [{ n: 1, label: 'Cuenta' }, { n: 2, label: 'Dashboard' }]
    : [{ n: 1, label: 'Cuenta' }, { n: 2, label: 'Pago' }, { n: 3, label: 'Dashboard' }];

  const font   = "'Plus Jakarta Sans', -apple-system, sans-serif";
  const fColor = plan.formColor;  // color primario del plan en panel derecho
  const fRgba  = plan.formRgba;   // versión rgba para focus rings

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: font }}>

      {/* ── Panel izquierdo ── */}
      <div style={{
        width: '420px',
        minWidth: '420px',
        maxWidth: '420px',
        background: plan.bg,
        display: 'none',
        flexDirection: 'column',
        padding: '40px 36px',
        position: 'relative',
        overflow: 'hidden',
      }}
        className="lg-panel"
      >
        {/* Orbs decorativos flotantes */}
        <div className="lp-orb-a" style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: `radial-gradient(circle, ${plan.accent}28 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <div className="lp-orb-b" style={{
          position: 'absolute', bottom: '-60px', left: '-60px',
          width: '250px', height: '250px', borderRadius: '50%',
          background: `radial-gradient(circle, ${plan.accent}18 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        {/* Barrido de luz */}
        <div className="lp-shimmer" />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: 'auto' }}>
          <img
            src="/logo.png"
            alt="MastexoPOS"
            height="36"
            width="auto"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            style={{ height: '36px', width: 'auto', objectFit: 'contain', maxWidth: '140px' }}
          />
          <div style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.12)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.85)" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h18M3 17h18M9 9V5m6 4V5M5 9h14a1 1 0 011 1v1H4v-1a1 1 0 011-1z" />
              </svg>
            </div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>
              Mastexo<span style={{ color: plan.accent }}>POS</span>
            </span>
          </div>
        </div>

        {/* Contenido centrado */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 0' }}>

          {/* Badge */}
          <div className="lp-badge" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: plan.badgeBg, border: `1px solid ${plan.accent}33`,
            borderRadius: '20px', padding: '4px 12px', marginBottom: '20px',
            width: 'fit-content',
          }}>
            {planKey === 'pro'      && <StarIcon color={plan.accent} />}
            {planKey === 'business' && <BuildingIcon color={plan.accent} />}
            <span style={{ color: plan.accent, fontSize: '12px', fontWeight: 700, letterSpacing: '0.02em' }}>
              {plan.badge}
            </span>
          </div>

          {/* Headline */}
          <h1 className="lp-h1a" style={{
            fontFamily: 'Instrument Serif, Georgia, serif',
            fontSize: '36px', fontWeight: 700, lineHeight: 1.15,
            color: '#fff', marginBottom: '6px',
          }}>
            {plan.headline}
          </h1>
          <h1 className="lp-h1b" style={{
            fontFamily: 'Instrument Serif, Georgia, serif',
            fontSize: '36px', fontWeight: 700, lineHeight: 1.15,
            color: plan.emColor, fontStyle: 'italic', marginBottom: '28px',
          }}>
            {plan.sub}
          </h1>

          {/* Precio */}
          <div className="lp-price" style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '28px' }}>
            <span className="lp-price-num" style={{ fontSize: '52px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
              {plan.price}
            </span>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.50)', maxWidth: '120px', lineHeight: 1.3 }}>
              {plan.priceSub}
            </span>
          </div>

          {/* Features */}
          <ul className="lp-features" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px', padding: 0, listStyle: 'none' }}>
            {plan.features.map((f) => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255,255,255,0.78)', fontSize: '13.5px' }}>
                <CheckIcon color={plan.accent} />
                {f}
              </li>
            ))}
          </ul>

          {/* Guarantee */}
          <div className="lp-guarantee" style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex', gap: '10px', alignItems: 'flex-start',
          }}>
            <span style={{ color: plan.accent, fontSize: '14px', marginTop: '1px' }}>{plan.guarantee.icon}</span>
            <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: '12.5px', lineHeight: 1.5, margin: 0 }}>
              {plan.guarantee.text}
            </p>
          </div>
        </div>

        <p style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.22)', fontSize: '11px' }}>
          © 2025 MastexoPOS
        </p>
      </div>

      {/* ── Estilos globales + animaciones ── */}
      <style>{`
        @media (min-width: 1024px) { .lg-panel { display: flex !important; } }
        @media (min-width: 1024px) { .mobile-logo { display: none !important; } }

        /* Spinner del botón */
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Panel izquierdo — orbs flotantes */
        @keyframes floatA {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(-14px,-20px) scale(1.06); }
          66%      { transform: translate(8px,-10px) scale(0.97); }
        }
        @keyframes floatB {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(12px,16px) scale(0.94); }
          75%      { transform: translate(-8px,8px) scale(1.04); }
        }

        /* Entrada de contenido del panel izquierdo */
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* Pulso suave del precio */
        @keyframes pricePulse {
          0%,100% { opacity:1; }
          50%      { opacity:0.82; }
        }

        /* Barrido de luz sobre el panel */
        @keyframes shimmerPanel {
          0%   { transform: translateX(-120%) skewX(-20deg); }
          100% { transform: translateX(250%) skewX(-20deg); }
        }

        /* Aplica animaciones al panel izquierdo */
        .lp-orb-a { animation: floatA 9s ease-in-out infinite; }
        .lp-orb-b { animation: floatB 11s ease-in-out infinite; }
        .lp-badge  { animation: fadeUp 0.55s ease 0.05s both; }
        .lp-h1a    { animation: fadeUp 0.55s ease 0.15s both; }
        .lp-h1b    { animation: fadeUp 0.55s ease 0.25s both; }
        .lp-price  { animation: fadeUp 0.55s ease 0.35s both; }
        .lp-price-num { animation: pricePulse 4s ease-in-out infinite; }
        .lp-features { animation: fadeUp 0.55s ease 0.45s both; }
        .lp-guarantee { animation: fadeUp 0.55s ease 0.55s both; }
        .lp-shimmer {
          position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 2;
        }
        .lp-shimmer::after {
          content: '';
          position: absolute; top: 0; left: 0;
          width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          animation: shimmerPanel 6s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes spin         { to { transform: rotate(0deg); } }
          .lp-orb-a, .lp-orb-b   { animation: none; }
          .lp-badge, .lp-h1a, .lp-h1b, .lp-price, .lp-features, .lp-guarantee { animation: none; opacity: 1; }
          .lp-shimmer::after      { animation: none; }
        }
      `}</style>

      {/* ── Panel derecho ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#fff', padding: '40px 24px', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Logo móvil */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }} className="mobile-logo">
            <img
              src="/logo.png"
              alt="MastexoPOS"
              style={{ height: '32px', width: 'auto', objectFit: 'contain', maxWidth: '120px' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'inline';
              }}
            />
            <span style={{ display: 'none', fontWeight: 700, fontSize: '17px', color: '#0D1B3E' }}>
              Mastexo<span style={{ color: fColor }}>POS</span>
            </span>
          </div>

          {/* Steps indicator */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
            {steps.map((s, i) => {
              const isActive = payStep === 'payment' ? s.n === 2 : s.n === 1;
              const isDone   = payStep === 'payment' && s.n === 1;
              return (
                <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: isActive ? fColor : isDone ? '#22c55e' : '#f1f5f9',
                      color: (isActive || isDone) ? '#fff' : '#94a3b8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 700, flexShrink: 0,
                    }}>
                      {isDone ? '✓' : s.n}
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? fColor : isDone ? '#16a34a' : '#94a3b8',
                      whiteSpace: 'nowrap',
                    }}>
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0', margin: '0 8px' }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Pantalla de pago PayPal (step 2) ── */}
          {payStep === 'payment' && (
            <div>
              {/* Resumen de lo que están pagando */}
              <div style={{
                background: '#f8fafc', border: '1.5px solid #e2e8f0',
                borderRadius: '12px', padding: '16px 20px', marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', margin: 0 }}>
                      Plan {planKey === 'pro' ? 'Pro' : 'Business'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                      Facturación mensual · sin contrato
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 800, fontSize: '22px', color: '#0f172a', margin: 0 }}>
                      {planKey === 'pro' ? '$29' : '$79'}
                    </p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>USD / mes</p>
                  </div>
                </div>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '12px 0' }} />
                <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
                  ✓ Cuenta creada para <strong>{email}</strong>
                </p>
              </div>

              {/* Error de pago */}
              {payError && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  background: '#fff5f5', border: '1.5px solid #fca5a5',
                  borderRadius: '10px', padding: '12px 14px', marginBottom: '16px',
                  color: '#dc2626', fontSize: '13px',
                }}>
                  <WarnIcon />
                  <span>{payError}</span>
                </div>
              )}

              {/* Botón PayPal SDK real */}
              <PayPalButton
                plan={planKey}
                onSuccess={handlePaySuccess}
                onError={handlePayError}
              />

              <p style={{
                textAlign: 'center', fontSize: '11.5px', color: '#94a3b8',
                marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              }}>
                <LockIcon /> Pago seguro via PayPal · Tu información nunca toca nuestros servidores
              </p>
            </div>
          )}

          {/* Social proof — solo en step 1 */}
          <div style={{
            display: payStep === 'payment' ? 'none' : 'flex', alignItems: 'center', gap: '10px',
            background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: '10px', padding: '10px 14px', marginBottom: '28px',
          }}>
            <div style={{ display: 'flex', marginRight: '2px' }}>
              {[
                { bg: '#0066CC', letter: 'J' },
                { bg: '#059669', letter: 'A' },
                { bg: '#7c3aed', letter: 'C' },
              ].map((av, i) => (
                <div key={i} style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: av.bg, border: '2px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 700, color: '#fff',
                  marginLeft: i > 0 ? '-8px' : 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}>
                  {av.letter}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '12.5px', color: '#475569', fontWeight: 500, margin: 0 }}>
              {planKey === 'free'     && '200+ restaurantes ya en el plan gratuito'}
              {planKey === 'pro'      && 'El plan preferido por restaurantes en crecimiento'}
              {planKey === 'business' && 'Cadenas con 3+ locales eligen Business'}
            </p>
          </div>

          {/* Encabezado — solo en step 1 */}
          {payStep !== 'payment' && <p style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.08em', color: fColor, textTransform: 'uppercase', marginBottom: '6px' }}>
            Crear cuenta
          </p>}
          {payStep !== 'payment' && (
            <>
              <h2 style={{ fontFamily: 'Instrument Serif, Georgia, serif', fontSize: '26px', fontWeight: 700, color: '#0D1B3E', marginBottom: '4px', lineHeight: 1.2 }}>
                {planKey === 'free'     ? 'Empieza gratis hoy'     : ''}
                {planKey === 'pro'      ? 'Activa el Plan Pro'      : ''}
                {planKey === 'business' ? 'Activa el Plan Business' : ''}
              </h2>
              <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '24px' }}>
                {planKey === 'free' ? 'Sin tarjeta de crédito, sin compromisos.' : 'Completa el registro y configura el pago.'}
              </p>
            </>
          )}

          {/* ── Formulario (solo en step 1) ── */}
          <form onSubmit={handleSubmit} noValidate style={{ display: payStep === 'payment' ? 'none' : 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* 1. Nombre del restaurante */}
            <Field
              label="Nombre del restaurante"
              value={restaurante}
              onChange={(e) => { setRestaurante(e.target.value); clearFieldErr('restaurante'); setSubmitErr(''); }}
              placeholder="Ej: La Trattoria"
              autoComplete="organization"
              error={errors.restaurante}
              accentColor={fColor}
              accentRgba={fRgba}
            />

            {/* 2. Email */}
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearFieldErr('email'); setSubmitErr(''); }}
              placeholder="tu@correo.com"
              autoComplete="email"
              error={errors.email}
              accentColor={fColor}
              accentRgba={fRgba}
            />

            {/* 3. Tu nombre — opcional, después del email para reducir fricción */}
            <Field
              label="Tu nombre"
              optional
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); clearFieldErr('nombre'); }}
              placeholder="Ej: Carlos González"
              autoComplete="name"
              error={errors.nombre}
              accentColor={fColor}
              accentRgba={fRgba}
            />

            {/* 4. Contraseña */}
            <Field
              label="Contraseña"
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearFieldErr('password'); setSubmitErr(''); }}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              error={errors.password}
              accentColor={fColor}
              accentRgba={fRgba}
              suffix={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd((v) => !v)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
                >
                  <EyeIcon open={showPwd} />
                </button>
              }
            />

            {/* Términos */}
            <div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => { setTerms(e.target.checked); clearFieldErr('terms'); }}
                  style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer', accentColor: fColor, flexShrink: 0 }}
                />
                <span style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                  Acepto los{' '}
                  <a href="/terminos" target="_blank" style={{ color: fColor, textDecoration: 'underline', fontWeight: 600 }}>Términos de servicio</a>
                  {' '}y la{' '}
                  <a href="/privacidad" target="_blank" style={{ color: fColor, textDecoration: 'underline', fontWeight: 600 }}>Política de privacidad</a>
                </span>
              </label>
              {errors.terms && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ef4444', fontSize: '12px', marginTop: '5px', paddingLeft: '26px' }}>
                  <WarnIcon />
                  {errors.terms}
                </div>
              )}
            </div>

            {/* Error global */}
            {submitErr && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                background: '#fff5f5', border: '1.5px solid #fca5a5',
                borderRadius: '10px', padding: '12px 14px',
                color: '#dc2626', fontSize: '13px',
              }}>
                <WarnIcon />
                <span>
                  {submitErr === '__login__' ? (
                    <>Este email ya tiene una cuenta.{' '}
                      <a href="/login" style={{ color: '#dc2626', fontWeight: 700, textDecoration: 'underline' }}>
                        ¿Iniciar sesión?
                      </a>
                    </>
                  ) : submitErr}
                </span>
              </div>
            )}

            {/* Botón CTA */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '10px',
                background: loading ? '#94a3b8' : plan.btnBg,
                color: '#fff',
                fontFamily: font,
                fontWeight: 700,
                fontSize: '15px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: loading ? 'none' : plan.btnShadow,
                transition: 'transform 0.15s, box-shadow 0.15s, background 0.15s',
                letterSpacing: '-0.01em',
              }}
              onMouseOver={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = plan.btnShadow.replace('16px', '22px'); } }}
              onMouseOut={(e)  => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : plan.btnShadow; }}
            >
              {loading ? (
                <>
                  <svg width="16" height="16" style={{ animation: 'spin 0.8s linear infinite' }} fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  {planKey === 'free' ? 'Creando cuenta...' : 'Procesando...'}
                </>
              ) : plan.btnLabel}
            </button>

            {/* Nota de seguridad */}
            {plan.payNote && !loading && (
              <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <LockIcon /> {plan.payNote}
              </p>
            )}
          </form>

          {/* Footer */}
          <p style={{ textAlign: 'center', fontSize: '13.5px', color: '#64748b', marginTop: '24px' }}>
            ¿Ya tienes cuenta?{' '}
            <a
              href="/login"
              style={{ color: fColor, fontWeight: 700, textDecoration: 'none' }}
              onMouseOver={(e) => (e.target.style.textDecoration = 'underline')}
              onMouseOut={(e)  => (e.target.style.textDecoration = 'none')}
            >
              Iniciar sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
