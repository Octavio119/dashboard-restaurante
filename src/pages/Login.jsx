import { useState } from 'react';
import { useAuth } from '../AuthContext';
import AuthBackground, { useAuthFonts } from '../components/AuthBackground';

function handleRipple(e) {
  const btn  = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const span = document.createElement('span');
  span.style.cssText = `
    position:absolute;
    width:${size}px;height:${size}px;border-radius:50%;
    background:rgba(255,255,255,0.22);
    top:${e.clientY - rect.top - size / 2}px;
    left:${e.clientX - rect.left - size / 2}px;
    transform:scale(0);
    animation:authRipple 0.55s ease-out forwards;
    pointer-events:none;
  `;
  btn.appendChild(span);
  span.addEventListener('animationend', () => span.remove());
}

export default function Login() {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  useAuthFonts();

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

  const font      = "'DM Sans', 'Inter', sans-serif";
  const titleFont = "'Syne', sans-serif";

  const inputBase = {
    width: '100%', height: '44px', padding: '0 12px',
    border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px',
    fontSize: '14px', color: '#fff', background: 'rgba(255,255,255,0.04)',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: font,
  };

  return (
    <AuthBackground style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: font }}>

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div className="anim-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: '#6C63FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 0 20px rgba(108,99,255,0.40)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11l19-9-9 19-2-8-8-2z" />
            </svg>
          </div>
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff', letterSpacing: '-0.01em', fontFamily: titleFont }}>
            MastexoPOS
          </span>
        </div>

        {/* Encabezado */}
        <h1 className="anim-title" style={{
          fontSize: '24px', fontWeight: '700', color: '#fff',
          margin: '0 0 6px', letterSpacing: '-0.02em', lineHeight: '1.3', fontFamily: titleFont,
        }}>
          Bienvenido de vuelta
        </h1>
        <p className="anim-subtitle" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.50)', margin: '0 0 28px', lineHeight: '1.5' }}>
          Ingresa a tu panel de gestión
        </p>

        <form onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div className="anim-email" style={{ marginBottom: '16px' }}>
            <label htmlFor="email" style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.50)', marginBottom: '6px' }}>
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
              style={inputBase}
              onFocus={(e) => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.15)'; }}
              onBlur={(e)  => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Contraseña */}
          <div className="anim-password" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label htmlFor="password" style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.50)' }}>
                Contraseña
              </label>
              <a
                href="/forgot-password"
                style={{ fontSize: '12px', color: '#9B93FF', textDecoration: 'none', fontWeight: '500' }}
                onMouseOver={(e) => (e.target.style.opacity = '0.7')}
                onMouseOut={(e)  => (e.target.style.opacity = '1')}
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
                style={{ ...inputBase, padding: '0 40px 0 12px' }}
                onFocus={(e) => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.15)'; }}
                onBlur={(e)  => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                tabIndex={-1}
                aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0',
                  color: 'rgba(255,255,255,0.30)', display: 'flex', alignItems: 'center',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
                onMouseOut={(e)  => (e.currentTarget.style.color = 'rgba(255,255,255,0.30)')}
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
              background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)',
              color: '#fca5a5', fontSize: '13px',
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
            className="anim-btn"
            onClick={!loading ? handleRipple : undefined}
            style={{
              width: '100%', height: '46px', borderRadius: '10px',
              background: loading ? 'rgba(108,99,255,0.50)' : '#6C63FF',
              color: '#fff', fontSize: '15px', fontWeight: '600',
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'background 0.15s, transform 0.2s, box-shadow 0.2s',
              fontFamily: font,
              boxShadow: loading ? 'none' : '0 4px 24px rgba(108,99,255,0.35)',
              position: 'relative', overflow: 'hidden',
            }}
            onMouseOver={(e) => { if (!loading) { e.currentTarget.style.background = '#5B52E5'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(108,99,255,0.45)'; } }}
            onMouseOut={(e)  => { e.currentTarget.style.background = loading ? 'rgba(108,99,255,0.50)' : '#6C63FF'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 24px rgba(108,99,255,0.35)'; }}
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
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.30)' }}>o continúa con</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Social login — UI only */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => { window.location.href = (import.meta.env.VITE_BACKEND_URL || '') + '/api/auth/google'; }}
            style={{
              flex: 1, height: '42px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
              color: '#fff', fontSize: '13px', fontWeight: '500',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'border-color 0.2s, background 0.2s', fontFamily: font,
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#6C63FF'; e.currentTarget.style.background = 'rgba(108,99,255,0.08)'; }}
            onMouseOut={(e)  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M5.27 9.77A7.18 7.18 0 0 1 12 4.8c1.74 0 3.3.63 4.53 1.66l3.37-3.37A12 12 0 0 0 12 0 12 12 0 0 0 1.32 6.64l3.95 3.13z"/>
              <path fill="#34A853" d="M16.04 18.01A7.19 7.19 0 0 1 12 19.2c-3.09 0-5.73-1.95-6.73-4.71l-3.97 3.06A12 12 0 0 0 12 24c3.24 0 6.18-1.22 8.41-3.2l-4.37-2.79z"/>
              <path fill="#4A90D9" d="M23.73 12.27c0-.8-.07-1.57-.2-2.32H12v4.64h6.58a5.7 5.7 0 0 1-2.54 3.64l4.37 2.79c2.54-2.31 3.32-5.76 3.32-8.75z"/>
              <path fill="#FBBC05" d="M5.27 14.49A7.2 7.2 0 0 1 4.8 12c0-.87.15-1.71.43-2.49l-3.91-3.1A12 12 0 0 0 0 12c0 1.99.48 3.86 1.32 5.52l3.95-3.03z"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            style={{
              flex: 1, height: '42px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
              color: '#fff', fontSize: '13px', fontWeight: '500',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'border-color 0.2s, background 0.2s', fontFamily: font,
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#6C63FF'; e.currentTarget.style.background = 'rgba(108,99,255,0.08)'; }}
            onMouseOut={(e)  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            <svg width="14" height="17" viewBox="0 0 814 1000" fill="white">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 383.3 27.6 313.9 24.4 276.5c-3.2-35.6-.6-71.5 11-106.8C67.6 51 107.3 0 198.2 0c92.4 0 134.2 63.3 148.4 80.3 47.7-45.4 109.5-80.3 172.9-80.3 86 0 133.1 50 159.3 115.4 12.3 32.3 17.1 57.2 17.1 83.4 0 48.3-19.8 83.4-108.2 141.4zM510.4 210.2c13-17.1 19.1-37.9 19.1-58.7 0-26.2-12.3-55.8-37.9-76.7-25.6-20.9-53.8-31.3-83.4-31.3-6.5 0-13 .6-19.8 1.3 25.6 35.6 42.8 79.1 42.8 119.9 0 29.6-8.4 55.8-22.7 79.1 32.9-3.9 72.4-20.9 101.9-33.6z"/>
            </svg>
            Apple
          </button>
        </div>

        {/* Registro */}
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.40)', margin: '0 0 24px' }}>
          ¿No tienes cuenta?{' '}
          <a
            href="/register"
            style={{ color: '#9B93FF', fontWeight: '500', textDecoration: 'none' }}
            onMouseOver={(e) => (e.target.style.opacity = '0.7')}
            onMouseOut={(e)  => (e.target.style.opacity = '1')}
          >
            Crear cuenta gratis
          </a>
        </p>

        {/* Trust badges */}
        <div className="anim-badges" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          {[
            { icon: '🔒', text: 'SSL' },
            { icon: '⚡', text: '99.9%' },
            { icon: '🌎', text: 'LatAm' },
          ].map(({ icon, text }) => (
            <span key={text} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
              <span>{icon}</span>
              <span>{text}</span>
            </span>
          ))}
        </div>

      </div>

      <style>{`
        .anim-logo     { animation: fadeUp 0.5s ease 0.10s both; }
        .anim-title    { animation: fadeUp 0.5s ease 0.20s both; }
        .anim-subtitle { animation: fadeUp 0.5s ease 0.30s both; }
        .anim-email    { animation: fadeUp 0.5s ease 0.35s both; }
        .anim-password { animation: fadeUp 0.5s ease 0.45s both; }
        .anim-btn      { animation: fadeUp 0.5s ease 0.55s both; }
        .anim-badges   { animation: fadeUp 0.5s ease 0.75s both; }
        #email::placeholder, #password::placeholder { color: rgba(255,255,255,0.20); }
      `}</style>
    </AuthBackground>
  );
}
