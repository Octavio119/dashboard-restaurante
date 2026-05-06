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
    <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Geist', 'Inter', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11l19-9-9 19-2-8-8-2z" />
            </svg>
          </div>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#0F172A', letterSpacing: '-0.01em' }}>
            MastexoPOS
          </span>
        </div>

        {/* Encabezado */}
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.02em', lineHeight: '1.3' }}>
          Bienvenido de vuelta
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 28px', lineHeight: '1.5' }}>
          Ingresa a tu panel de gestión
        </p>

        <form onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="email" style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="tu@correo.com"
              required
              style={{
                width: '100%', height: '42px', padding: '0 12px',
                border: '1px solid #E2E8F0', borderRadius: '8px',
                fontSize: '14px', color: '#0F172A', background: '#fff',
                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563EB';
                e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E2E8F0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Contraseña */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label htmlFor="password" style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                Contraseña
              </label>
              <a
                href="/forgot-password"
                style={{ fontSize: '12px', color: '#2563EB', textDecoration: 'none', fontWeight: '500' }}
                onMouseOver={(e) => (e.target.style.opacity = '0.7')}
                onMouseOut={(e) => (e.target.style.opacity = '1')}
              >
                ¿Olvidaste?
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                required
                style={{
                  width: '100%', height: '42px', padding: '0 40px 0 12px',
                  border: '1px solid #E2E8F0', borderRadius: '8px',
                  fontSize: '14px', color: '#0F172A', background: '#fff',
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563EB';
                  e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E2E8F0';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                tabIndex={-1}
                aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: '#94A3B8',
                  display: 'flex', alignItems: 'center',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#475569')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                {showPwd ? (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error inline */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 12px', borderRadius: '8px', marginBottom: '16px',
              background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '13px',
            }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          {/* Botón submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', height: '42px', borderRadius: '8px',
              background: loading ? '#334155' : '#0F172A',
              color: '#fff', fontSize: '14px', fontWeight: '500',
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'background 0.15s, transform 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseOver={(e) => { if (!loading) { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseOut={(e) => { e.currentTarget.style.background = loading ? '#334155' : '#0F172A'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>o</span>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
        </div>

        {/* Registro */}
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', margin: '0 0 24px' }}>
          ¿No tienes cuenta?{' '}
          <a
            href="/register"
            style={{ color: '#2563EB', fontWeight: '500', textDecoration: 'none' }}
            onMouseOver={(e) => (e.target.style.opacity = '0.7')}
            onMouseOut={(e) => (e.target.style.opacity = '1')}
          >
            Crear cuenta gratis
          </a>
        </p>

        {/* Trust row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          {[
            { icon: '🔒', text: 'SSL' },
            { icon: '⚡', text: '99.9%' },
            { icon: '🌎', text: 'LatAm' },
          ].map(({ icon, text }) => (
            <span key={text} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94A3B8' }}>
              <span>{icon}</span>
              <span>{text}</span>
            </span>
          ))}
        </div>

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
