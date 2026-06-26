import { useState } from 'react';
import { api } from '../api';
import PayPalButton from '../components/PayPalButton';
import { PLANS as PLAN_CFG } from '../config/plans';
import AuthBackground, { useAuthFonts } from '../components/AuthBackground';

// ─── Plan config ──────────────────────────────────────────────────────────────
const PLANS = {
  trial: {
    badge:     '14 días gratis · Sin tarjeta',
    badgeBg:   'rgba(108,99,255,0.15)',
    badgeColor:'#9B93FF',
    badgeBorder:'rgba(108,99,255,0.30)',
    headline:  '14 días gratis.',
    sub:       'Sin tarjeta. Sin compromisos.',
    emColor:   '#6C63FF',
    tagline:   'MastexoPOS: sistema de pedidos para restaurantes que quieren crecer sin contratar más personal.',
    price:     null,
    priceSub:  null,
    features: [
      'Pedidos ilimitados durante 14 días',
      'Múltiples usuarios sin costo adicional',
      'Reportes y analytics en tiempo real',
      'Soporte incluido durante el trial',
      'Sin sorpresas al vencer — te avisamos 3 días antes',
    ],
    guarantee: { icon: '✦', text: 'Únete a más de 34 restaurantes que ya usan MastexoPOS' },
    guaranteeBg:     '#1A1830',
    guaranteeBorder: 'rgba(108,99,255,0.20)',
    bg:        'linear-gradient(160deg, #0F0E1A 0%, #13112A 55%, #1A1830 100%)',
    accent:    '#6C63FF',
    btnLabel:  'Crear cuenta gratis →',
    btnBg:     '#6C63FF',
    btnHover:  '#5B52E5',
    btnShadow: '0 4px 24px rgba(108,99,255,0.35)',
    payNote:   null,
    formColor: '#6C63FF',
    formRgba:  'rgba(108,99,255,0.20)',
  },
  pro: {
    badge:     'Más popular',
    badgeBg:   'rgba(91,168,245,0.15)',
    badgeColor:'#5ba8f5',
    headline:  'El sistema que',
    sub:       'trabaja por ti',
    emColor:   '#5ba8f5',
    price:     `$${PLAN_CFG.pro.price}`,
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
    btnBg:     '#6C63FF',
    btnHover:  '#5B52E5',
    btnShadow: '0 4px 24px rgba(108,99,255,0.35)',
    payNote:   'Serás redirigido a PayPal de forma segura',
    formColor: '#6C63FF',
    formRgba:  'rgba(108,99,255,0.20)',
  },
  business: {
    badge:     'Plan Business',
    badgeBg:   'rgba(192,132,252,0.15)',
    badgeColor:'#c084fc',
    headline:  'Escala tu cadena',
    sub:       'sin límites',
    emColor:   '#c084fc',
    price:     `$${PLAN_CFG.business.price}`,
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
    formColor: '#7c3aed',
    formRgba:  'rgba(124,58,237,0.12)',
  },
};

function getPlan() {
  const p = new URLSearchParams(window.location.search).get('plan');
  return p === 'pro' || p === 'business' ? p : 'trial';
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

function LockIcon() {
  return (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

// ─── Field component — dark theme ─────────────────────────────────────────────
function Field({ label, optional, type = 'text', value, onChange, placeholder, error, autoComplete, suffix, accentColor = '#6C63FF', accentRgba = 'rgba(108,99,255,0.15)' }) {
  const [focused, setFocused] = useState(false);

  const borderColor = error ? '#ef4444' : focused ? accentColor : 'rgba(255,255,255,0.10)';
  const shadowStyle = focused && !error
    ? `0 0 0 3px ${accentRgba}`
    : error ? '0 0 0 3px rgba(239,68,68,0.10)' : 'none';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em' }}>
          {label}
        </label>
        {optional && (
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.30)', fontWeight: 500 }}>Opcional</span>
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
            background: error ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
            color: '#fff',
            fontSize: '14px',
            fontFamily: 'inherit',
            outline: 'none',
            boxShadow: shadowStyle,
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxSizing: 'border-box',
          }}
        />
        {suffix && (
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.30)', cursor: 'pointer' }}>
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fca5a5', fontSize: '12px' }}>
          <WarnIcon />
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Register() {
  useAuthFonts();
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

      if (planKey !== 'trial') {
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

  const steps = planKey === 'trial'
    ? [{ n: 1, label: 'Cuenta' }, { n: 2, label: 'Dashboard' }]
    : [{ n: 1, label: 'Cuenta' }, { n: 2, label: 'Pago' }, { n: 3, label: 'Dashboard' }];

  const font   = "'DM Sans', 'Inter', sans-serif";
  const titleFont = "'Syne', sans-serif";
  const fColor = plan.formColor;
  const fRgba  = plan.formRgba;

  return (
    <AuthBackground style={{ display: 'flex', alignItems: 'stretch', overflow: 'auto', fontFamily: font }}>

      {/* ── Estilos globales + animaciones ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Animaciones de entrada — formulario */
        .anim-reg-logo   { animation: fadeUp 0.5s ease 0.10s both; }
        .anim-reg-steps  { animation: fadeUp 0.5s ease 0.20s both; }
        .anim-reg-social { animation: fadeUp 0.5s ease 0.30s both; }
        .anim-reg-header { animation: fadeUp 0.5s ease 0.35s both; }
        .anim-reg-form   { animation: fadeUp 0.5s ease 0.45s both; }
        .anim-reg-footer { animation: fadeUp 0.5s ease 0.60s both; }

        /* Placeholder color en inputs oscuros */
        .reg-panel input::placeholder { color: rgba(255,255,255,0.25); }

        @media (prefers-reduced-motion: reduce) {
          @keyframes spin { to { transform: rotate(0deg); } }
        }
      `}</style>

      {/* ── Formulario centrado (sin panel de value prop) ── */}
      <div className="reg-panel" style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>

          {/* Logo */}
          <div className="anim-reg-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#6C63FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 0 16px rgba(108,99,255,0.35)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11l19-9-9 19-2-8-8-2z" />
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: '17px', color: '#fff', fontFamily: titleFont }}>
              Mastexo<span style={{ color: fColor }}>POS</span>
            </span>
          </div>

          {/* Steps indicator */}
          <div className="anim-reg-steps" style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
            {steps.map((s, i) => {
              const isActive = payStep === 'payment' ? s.n === 2 : s.n === 1;
              const isDone   = payStep === 'payment' && s.n === 1;
              return (
                <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: isActive ? fColor : isDone ? '#22c55e' : 'rgba(255,255,255,0.08)',
                      color: (isActive || isDone) ? '#fff' : 'rgba(255,255,255,0.30)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 700, flexShrink: 0,
                    }}>
                      {isDone ? '✓' : s.n}
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? fColor : isDone ? '#4ade80' : 'rgba(255,255,255,0.30)',
                      whiteSpace: 'nowrap',
                    }}>
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.10)', margin: '0 8px' }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Pantalla de pago PayPal (step 2) ── */}
          {payStep === 'payment' && (
            <div>
              <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.10)',
                borderRadius: '12px', padding: '16px 20px', marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '15px', color: '#fff', margin: 0 }}>
                      Plan {planKey === 'pro' ? 'Pro' : 'Business'}
                    </p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>
                      Facturación mensual · sin contrato
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 800, fontSize: '22px', color: '#fff', margin: 0 }}>
                      {planKey === 'pro' ? `$${PLAN_CFG.pro.price}` : `$${PLAN_CFG.business.price}`}
                    </p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.30)', margin: 0 }}>USD / mes</p>
                  </div>
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.10)', margin: '12px 0' }} />
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
                  ✓ Cuenta creada para <strong style={{ color: '#fff' }}>{email}</strong>
                </p>
              </div>

              {payError && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  background: 'rgba(239,68,68,0.10)', border: '1.5px solid rgba(239,68,68,0.30)',
                  borderRadius: '10px', padding: '12px 14px', marginBottom: '16px',
                  color: '#fca5a5', fontSize: '13px',
                }}>
                  <WarnIcon />
                  <span>{payError}</span>
                </div>
              )}

              <PayPalButton
                plan={planKey}
                onSuccess={handlePaySuccess}
                onError={handlePayError}
              />

              <p style={{
                textAlign: 'center', fontSize: '11.5px', color: 'rgba(255,255,255,0.30)',
                marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              }}>
                <LockIcon /> Pago seguro via PayPal · Tu información nunca toca nuestros servidores
              </p>
            </div>
          )}

          {/* Social proof — solo en step 1 */}
          <div className="anim-reg-social" style={{
            display: payStep === 'payment' ? 'none' : 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px', padding: '10px 14px', marginBottom: '28px',
          }}>
            <div style={{ display: 'flex', marginRight: '2px' }}>
              {[
                { bg: '#6C63FF', letter: 'J' },
                { bg: '#059669', letter: 'A' },
                { bg: '#7c3aed', letter: 'C' },
              ].map((av, i) => (
                <div key={i} style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: av.bg, border: '2px solid rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 700, color: '#fff',
                  marginLeft: i > 0 ? '-8px' : 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.30)',
                }}>
                  {av.letter}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.55)', fontWeight: 500, margin: 0 }}>
              {planKey === 'trial'    && 'Más de 34 restaurantes ya usan MastexoPOS'}
              {planKey === 'pro'      && 'El plan preferido por restaurantes en crecimiento'}
              {planKey === 'business' && 'Cadenas con 3+ locales eligen Business'}
            </p>
          </div>

          {/* Encabezado — solo en step 1 */}
          {payStep !== 'payment' && (
            <div className="anim-reg-header">
              <p style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.08em', color: fColor, textTransform: 'uppercase', marginBottom: '6px' }}>
                Crear cuenta
              </p>
              <h2 style={{ fontFamily: titleFont, fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '4px', lineHeight: 1.2 }}>
                {planKey === 'trial'    ? 'Crea tu cuenta gratis' : ''}
                {planKey === 'pro'      ? 'Activa el Plan Pro'      : ''}
                {planKey === 'business' ? 'Activa el Plan Business' : ''}
              </h2>
              <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px' }}>
                {planKey === 'trial' ? '14 días gratis. Sin tarjeta de crédito.' : 'Completa el registro y configura el pago.'}
              </p>
            </div>
          )}

          {/* ── Formulario (solo en step 1) ── */}
          <form onSubmit={handleSubmit} noValidate style={{ display: payStep === 'payment' ? 'none' : 'flex', flexDirection: 'column', gap: '16px' }} className="anim-reg-form">

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
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'rgba(255,255,255,0.30)', display: 'flex' }}
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
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.50)', lineHeight: 1.5 }}>
                  Acepto los{' '}
                  <a href="/terminos" target="_blank" style={{ color: fColor, textDecoration: 'underline', fontWeight: 600 }}>Términos de servicio</a>
                  {' '}y la{' '}
                  <a href="/privacidad" target="_blank" style={{ color: fColor, textDecoration: 'underline', fontWeight: 600 }}>Política de privacidad</a>
                </span>
              </label>
              {errors.terms && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fca5a5', fontSize: '12px', marginTop: '5px', paddingLeft: '26px' }}>
                  <WarnIcon />
                  {errors.terms}
                </div>
              )}
            </div>

            {/* Error global */}
            {submitErr && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                background: 'rgba(239,68,68,0.10)', border: '1.5px solid rgba(239,68,68,0.30)',
                borderRadius: '10px', padding: '12px 14px',
                color: '#fca5a5', fontSize: '13px',
              }}>
                <WarnIcon />
                <span>
                  {submitErr === '__login__' ? (
                    <>Este email ya tiene una cuenta.{' '}
                      <a href="/login" style={{ color: '#fca5a5', fontWeight: 700, textDecoration: 'underline' }}>
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
                background: loading ? 'rgba(108,99,255,0.50)' : plan.btnBg,
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
              onMouseOver={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = plan.btnShadow.replace('16px', '22px').replace('24px', '32px'); } }}
              onMouseOut={(e)  => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : plan.btnShadow; }}
            >
              {loading ? (
                <>
                  <svg width="16" height="16" style={{ animation: 'spin 0.8s linear infinite' }} fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  {planKey === 'trial' ? 'Creando cuenta...' : 'Procesando...'}
                </>
              ) : plan.btnLabel}
            </button>

            {plan.payNote && !loading && (
              <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.30)', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <LockIcon /> {plan.payNote}
              </p>
            )}

            {planKey === 'trial' && (
              <p style={{
                textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.40)', margin: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '10px',
              }}>
                <span>✓ 14 días gratis</span>
                <span>✓ Sin tarjeta de crédito</span>
                <span>✓ Cancela cuando quieras</span>
              </p>
            )}
          </form>

          {payStep !== 'payment' && (
            <>
              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.30)' }}>o continúa con</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Social login */}
              <button
                type="button"
                onClick={() => { window.location.href = (import.meta.env.VITE_BACKEND_URL || '') + '/api/auth/google'; }}
                style={{
                  width: '100%', height: '42px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
                  color: '#fff', fontSize: '13px', fontWeight: '500',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'border-color 0.2s, background 0.2s', fontFamily: font, marginBottom: '20px',
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = fColor; e.currentTarget.style.background = fRgba; }}
                onMouseOut={(e)  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.27 9.77A7.18 7.18 0 0 1 12 4.8c1.74 0 3.3.63 4.53 1.66l3.37-3.37A12 12 0 0 0 12 0 12 12 0 0 0 1.32 6.64l3.95 3.13z"/>
                  <path fill="#34A853" d="M16.04 18.01A7.19 7.19 0 0 1 12 19.2c-3.09 0-5.73-1.95-6.73-4.71l-3.97 3.06A12 12 0 0 0 12 24c3.24 0 6.18-1.22 8.41-3.2l-4.37-2.79z"/>
                  <path fill="#4A90D9" d="M23.73 12.27c0-.8-.07-1.57-.2-2.32H12v4.64h6.58a5.7 5.7 0 0 1-2.54 3.64l4.37 2.79c2.54-2.31 3.32-5.76 3.32-8.75z"/>
                  <path fill="#FBBC05" d="M5.27 14.49A7.2 7.2 0 0 1 4.8 12c0-.87.15-1.71.43-2.49l-3.91-3.1A12 12 0 0 0 0 12c0 1.99.48 3.86 1.32 5.52l3.95-3.03z"/>
                </svg>
                Continuar con Google
              </button>
            </>
          )}

          {/* Footer */}
          <p className="anim-reg-footer" style={{ textAlign: 'center', fontSize: '13.5px', color: 'rgba(255,255,255,0.40)', marginTop: '24px' }}>
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
    </AuthBackground>
  );
}
