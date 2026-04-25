import { useState } from 'react';
import { api } from '../api';

// ─── Plan config ──────────────────────────────────────────────────────────────
const PLAN_CONFIG = {
  pro: {
    label: 'Plan Pro',
    price: '$29/mes',
    badge: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    dot: 'bg-emerald-500',
  },
  business: {
    label: 'Plan Business',
    price: '$79/mes',
    badge: 'bg-violet-50 border-violet-200 text-violet-800',
    dot: 'bg-violet-500',
  },
};

function getPlanFromURL() {
  const p = new URLSearchParams(window.location.search).get('plan');
  return p === 'pro' || p === 'business' ? p : null;
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, id, type = 'text', value, onChange, placeholder, error, autoComplete }) {
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && showPwd ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition
            ${error
              ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100'
              : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10'
            }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            tabIndex={-1}
          >
            {showPwd ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── Password strength ────────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const bars = [
    score >= 1 ? (score === 1 ? 'bg-red-400' : score === 2 ? 'bg-amber-400' : 'bg-[#1D9E75]') : 'bg-gray-200',
    score >= 2 ? (score === 2 ? 'bg-amber-400' : 'bg-[#1D9E75]') : 'bg-gray-200',
    score >= 3 ? 'bg-[#1D9E75]' : 'bg-gray-200',
  ];
  const label = ['', 'Débil', 'Media', 'Fuerte'][score];
  const labelColor = ['', 'text-red-500', 'text-amber-500', 'text-[#1D9E75]'][score];

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {bars.map((cls, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-200 ${cls}`} />
        ))}
      </div>
      <span className={`text-xs font-medium ${labelColor}`}>{label}</span>
    </div>
  );
}

// ─── Register page ────────────────────────────────────────────────────────────
export default function Register() {
  const plan = getPlanFromURL();
  const planInfo = plan ? PLAN_CONFIG[plan] : null;

  const [form, setForm] = useState({
    nombre_restaurante: '',
    nombre_admin: '',
    email: '',
    password: '',
  });
  const [terms, setTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (fieldErrors[k]) setFieldErrors(fe => ({ ...fe, [k]: '' }));
    if (submitError) setSubmitError('');
  };

  const validate = () => {
    const errs = {};
    if (form.nombre_restaurante.trim().length < 2)
      errs.nombre_restaurante = 'Mínimo 2 caracteres.';
    if (form.nombre_admin.trim().length < 2)
      errs.nombre_admin = 'Mínimo 2 caracteres.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = 'Ingresa un email válido.';
    if (form.password.length < 8)
      errs.password = 'Mínimo 8 caracteres.';
    if (!terms)
      errs.terms = 'Debes aceptar los términos para continuar.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      // 1. Crear cuenta
      const data = await api.signup(
        form.nombre_restaurante.trim(),
        form.email.trim().toLowerCase(),
        form.password,
        form.nombre_admin.trim(),
      );

      // 2. Guardar sesión
      localStorage.setItem('token', data.token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // 3a. Plan de pago → ir a Stripe
      if (plan) {
        const checkout = await api.createCheckout(plan);
        window.location.href = checkout.url;
        return;
      }

      // 3b. Plan Starter → dashboard
      window.location.href = '/';
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('ya registrado') || msg.includes('409') || msg.includes('Email')) {
        setSubmitError('__login__'); // render especial con link
      } else if (
        msg.includes('fetch') ||
        msg.includes('network') ||
        msg.toLowerCase().includes('failed to fetch') ||
        msg.includes('NetworkError')
      ) {
        setSubmitError('Error de conexión. Intenta de nuevo.');
      } else {
        setSubmitError(msg || 'Error al crear la cuenta. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdf8] to-white flex flex-col">
      {/* Navbar mínimo */}
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <a href="/" className="text-xl font-extrabold tracking-tight">
          <span className="text-[#1D9E75]">Mesa</span>
          <span className="text-gray-900">OS</span>
        </a>
        <a
          href="/login"
          className="text-sm text-gray-500 hover:text-[#1D9E75] transition"
        >
          ¿Ya tienes cuenta? <span className="font-semibold">Inicia sesión</span>
        </a>
      </header>

      {/* Card central */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Plan badge */}
          <div className={`mb-6 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium ${
            planInfo ? planInfo.badge : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${planInfo ? planInfo.dot : 'bg-gray-400'}`} />
            {planInfo
              ? <>Estás activando el <strong>{planInfo.label}</strong> — {planInfo.price}</>
              : 'Plan Starter gratuito'}
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Crea tu cuenta</h1>
          <p className="text-sm text-gray-500 mb-7">
            {planInfo
              ? 'Completa el registro y te llevamos a configurar el pago.'
              : 'Empieza gratis, sin tarjeta de crédito.'}
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Field
              label="Nombre del restaurante"
              id="nombre_restaurante"
              value={form.nombre_restaurante}
              onChange={set('nombre_restaurante')}
              placeholder="Ej: La Trattoria"
              error={fieldErrors.nombre_restaurante}
              autoComplete="organization"
            />
            <Field
              label="Tu nombre"
              id="nombre_admin"
              value={form.nombre_admin}
              onChange={set('nombre_admin')}
              placeholder="Ej: Carlos González"
              error={fieldErrors.nombre_admin}
              autoComplete="name"
            />
            <Field
              label="Email"
              id="email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="tu@correo.com"
              error={fieldErrors.email}
              autoComplete="email"
            />
            <div>
              <Field
                label="Contraseña"
                id="password"
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Mínimo 8 caracteres"
                error={fieldErrors.password}
                autoComplete="new-password"
              />
              <PasswordStrength password={form.password} />
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => {
                    setTerms(e.target.checked);
                    if (fieldErrors.terms) setFieldErrors(fe => ({ ...fe, terms: '' }));
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#1D9E75] accent-[#1D9E75] cursor-pointer"
                />
                <span className="text-sm text-gray-600 leading-snug">
                  Acepto los{' '}
                  <a href="/terminos" target="_blank" className="text-[#1D9E75] hover:underline font-medium">
                    Términos de servicio
                  </a>{' '}
                  y la{' '}
                  <a href="/privacidad" target="_blank" className="text-[#1D9E75] hover:underline font-medium">
                    Política de privacidad
                  </a>
                </span>
              </label>
              {fieldErrors.terms && (
                <p className="mt-1 text-xs text-red-600 pl-7">{fieldErrors.terms}</p>
              )}
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  {submitError === '__login__' ? (
                    <>
                      Este email ya tiene una cuenta.{' '}
                      <a href="/login" className="font-semibold underline hover:no-underline">
                        ¿Quieres iniciar sesión?
                      </a>
                    </>
                  ) : submitError}
                </span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#1D9E75] text-white font-semibold text-sm
                hover:bg-[#178a64] active:bg-[#136b4e] transition
                disabled:opacity-60 disabled:cursor-not-allowed
                shadow-md shadow-[#1D9E75]/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {plan ? 'Creando cuenta...' : 'Creando tu cuenta...'}
                </>
              ) : (
                plan ? `Crear cuenta e ir a pago` : 'Crear cuenta gratis'
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-5 text-center text-xs text-gray-400">
            {plan
              ? 'Serás redirigido a Stripe para completar el pago de forma segura.'
              : 'Sin tarjeta de crédito · Cancela cuando quieras'}
          </p>
        </div>
      </main>
    </div>
  );
}
