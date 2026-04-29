import { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // AuthContext actualiza `user` → App.jsx renderiza dashboard automáticamente
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('401') || msg.includes('credenciales') || msg.includes('incorrectos') || msg.includes('expirada')) {
        setError('Email o contraseña incorrectos');
      } else if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
        setError('Sin conexión. Verifica tu internet.');
      } else {
        setError('Email o contraseña incorrectos');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Columna izquierda ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 30% 20%, #0a2a5e 0%, #0D1B3E 60%, #081429 100%)' }}
      >
        {/* Glow decorativo */}
        <div
          className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,102,204,0.18) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(29,158,117,0.12) 0%, transparent 70%)' }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, #0066CC, #004fa3)' }}
          >
            🍽
          </div>
          <div className="leading-tight">
            <span className="text-white font-bold text-xl tracking-tight">Mastexo</span>
            <span className="font-bold text-xl tracking-tight" style={{ color: '#5ba8f5' }}>POS</span>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <h1 className="text-5xl font-bold leading-tight mb-5" style={{ fontFamily: 'Instrument Serif, Georgia, serif', color: '#fff' }}>
            Tu restaurante,{' '}
            <em style={{ color: '#1D9E75', fontStyle: 'italic' }}>sin caos</em>
            {' '}desde hoy
          </h1>
          <p className="text-base leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.62)', maxWidth: '380px' }}>
            Más de 200 restaurantes en Chile y LatAm ya gestionan pedidos, mesas y ventas con MastexoPOS.
          </p>

          {/* Proof cards */}
          <div className="flex flex-col gap-3">
            {[
              { icon: '📈', text: '+35% más pedidos por turno', sub: 'Promedio en el primer mes' },
              { icon: '⚡', text: 'Setup en menos de 10 minutos', sub: 'Sin técnicos ni instalación' },
              { icon: '🔒', text: 'Datos seguros y respaldados', sub: 'Backups diarios automáticos' },
            ].map(({ icon, text, sub }) => (
              <div
                key={text}
                className="flex items-center gap-4 rounded-xl px-4 py-3"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span className="text-xl shrink-0">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{text}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pie izquierdo */}
        <p className="relative z-10 text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
          © 2025 MastexoPOS · Todos los derechos reservados
        </p>
      </div>

      {/* ── Columna derecha ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full" style={{ maxWidth: '420px' }}>
          {/* Logo móvil */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
              style={{ background: 'linear-gradient(135deg, #0066CC, #004fa3)' }}
            >
              🍽
            </div>
            <span className="font-bold text-lg">
              <span style={{ color: '#0D1B3E' }}>Mastexo</span>
              <span style={{ color: '#0066CC' }}>POS</span>
            </span>
          </div>

          {/* Eyebrow */}
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#0066CC' }}>
            Panel de control
          </p>

          {/* Título */}
          <h2
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: 'Instrument Serif, Georgia, serif', color: '#0D1B3E' }}
          >
            Bienvenido de vuelta
          </h2>
          <p className="text-sm mb-8" style={{ color: '#6b7280' }}>
            Ingresa tus datos para acceder a tu restaurante
          </p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Correo electrónico
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none select-none">✉</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onInput={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition"
                  style={{
                    border: '1.5px solid #e5e7eb',
                    background: '#f9fafb',
                    color: '#111827',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1.5px solid #0066CC';
                    e.target.style.background = '#fff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,102,204,0.10)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1.5px solid #e5e7eb';
                    e.target.style.background = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-sm font-medium" style={{ color: '#374151' }}>
                  Contraseña
                </label>
                <a
                  href="/forgot-password"
                  className="text-xs font-medium transition"
                  style={{ color: '#0066CC' }}
                  onMouseOver={(e) => (e.target.style.opacity = '0.75')}
                  onMouseOut={(e) => (e.target.style.opacity = '1')}
                >
                  ¿Olvidaste?
                </a>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none select-none">🔑</span>
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onInput={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-sm outline-none transition"
                  style={{
                    border: '1.5px solid #e5e7eb',
                    background: '#f9fafb',
                    color: '#111827',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1.5px solid #0066CC';
                    e.target.style.background = '#fff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,102,204,0.10)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1.5px solid #e5e7eb';
                    e.target.style.background = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition"
                  style={{ color: '#9ca3af' }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#374151')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#9ca3af')}
                  aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
              style={{
                background: loading ? '#4d94e0' : '#0066CC',
                boxShadow: '0 4px 14px rgba(0,102,204,0.30)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transform: 'translateY(0)',
                transition: 'transform 0.15s, box-shadow 0.15s, background 0.15s',
              }}
              onMouseOver={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,102,204,0.38)'; } }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,102,204,0.30)'; }}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Ingresando...
                </>
              ) : (
                'Ingresar al panel →'
              )}
            </button>
          </form>

          {/* Trust row */}
          <div className="flex items-center justify-center gap-4 mt-6">
            {[
              { icon: '🔒', text: 'SSL cifrado' },
              { icon: '⚡', text: '99.9% uptime' },
              { icon: '🇨🇱', text: 'Servidores LatAm' },
            ].map(({ icon, text }) => (
              <span key={text} className="flex items-center gap-1 text-xs" style={{ color: '#9ca3af' }}>
                <span>{icon}</span>
                <span>{text}</span>
              </span>
            ))}
          </div>

          {/* Footer */}
          <p className="text-center text-sm mt-6" style={{ color: '#6b7280' }}>
            ¿No tienes cuenta?{' '}
            <a
              href="/register"
              className="font-semibold transition"
              style={{ color: '#0066CC' }}
              onMouseOver={(e) => (e.target.style.opacity = '0.75')}
              onMouseOut={(e) => (e.target.style.opacity = '1')}
            >
              Crear cuenta gratis
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
