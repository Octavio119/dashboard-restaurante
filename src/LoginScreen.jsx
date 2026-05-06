import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthContext';

/* ── Inline styles scoped to login (light theme, no conflicts with dark app) ── */
const S = {
  page: {
    minHeight: '100vh',
    background: '#F9FAFB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif",
  },
  dotGrid: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    backgroundImage: 'radial-gradient(circle, #D1D5DB 1px, transparent 1px)',
    backgroundSize: '28px 28px',
    opacity: 0.55,
  },
  wrap: {
    width: '100%',
    maxWidth: 400,
    position: 'relative',
    zIndex: 1,
  },
  logoArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 32,
    gap: 10,
  },
  logoIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(109, 40, 217, 0.35)',
  },
  logoText: {
    fontSize: 16,
    fontWeight: 700,
    color: '#111827',
    letterSpacing: '-0.02em',
    margin: 0,
    lineHeight: 1,
  },
  logoAccent: {
    color: '#8B5CF6',
  },
  card: {
    background: '#FFFFFF',
    borderRadius: 16,
    padding: '36px 32px 32px',
    boxShadow:
      '0 1px 2px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.06)',
  },
  heading: {
    color: '#111827',
    fontWeight: 700,
    fontSize: 22,
    letterSpacing: '-0.025em',
    margin: '0 0 4px',
    lineHeight: 1.2,
  },
  subheading: {
    color: '#6B7280',
    fontSize: 14,
    margin: 0,
    lineHeight: 1.5,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 20,
    marginTop: 20,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    margin: 0,
    fontWeight: 500,
    lineHeight: 1.4,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginTop: 28,
  },
  fieldWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  label: {
    display: 'block',
    color: '#374151',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '-0.005em',
  },
  inputWrap: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: '#9CA3AF',
    lineHeight: 0,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9CA3AF',
    padding: 0,
    lineHeight: 0,
    display: 'flex',
    alignItems: 'center',
  },
  submitBtn: (loading) => ({
    width: '100%',
    padding: '11px 18px',
    borderRadius: 10,
    background: loading
      ? '#C4B5FD'
      : 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: 14,
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: loading ? 'none' : '0 4px 14px rgba(109, 40, 217, 0.35)',
    transition: 'opacity 0.15s, transform 0.1s',
    marginTop: 4,
    letterSpacing: '-0.01em',
  }),
  spinner: {
    width: 15,
    height: 15,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#FFFFFF',
    borderRadius: '50%',
    animation: 'lspin 0.75s linear infinite',
  },
  footer: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12.5,
    marginTop: 22,
  },
  footerLink: {
    color: '#8B5CF6',
    fontWeight: 500,
    textDecoration: 'none',
  },
};

/* ── Focus state via injected <style> (inline styles can't do :focus) ── */
const INJECT_CSS = `
  @keyframes lspin { to { transform: rotate(360deg); } }

  .ls-input {
    width: 100%;
    padding: 10px 12px 10px 38px;
    background: #FFFFFF;
    border: 1.5px solid #E5E7EB;
    border-radius: 9px;
    font-size: 14px;
    font-family: inherit;
    color: #111827;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s, box-shadow 0.15s;
    -webkit-appearance: none;
  }
  .ls-input::placeholder { color: #9CA3AF; }
  .ls-input:focus {
    border-color: #8B5CF6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
  }
  .ls-input.pr { padding-right: 42px; }

  .ls-btn:not(:disabled):hover {
    opacity: 0.92;
    transform: translateY(-1px);
  }
  .ls-btn:not(:disabled):active {
    transform: scale(0.985);
  }
`;

export default function LoginScreen() {
  const { login } = useAuth();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <style>{INJECT_CSS}</style>

      {/* Dot grid texture */}
      <div style={S.dotGrid} />

      <div style={S.wrap}>
        {/* Logo */}
        <div style={S.logoArea}>
          <div style={S.logoIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11l19-9-9 19-2-8-8-2z" />
            </svg>
          </div>
          <p style={S.logoText}>
            Mastexo<span style={S.logoAccent}>POS</span>
          </p>
        </div>

        {/* Card */}
        <div style={S.card}>
          <h2 style={S.heading}>Bienvenido de vuelta</h2>
          <p style={S.subheading}>Ingresa al panel de tu restaurante</p>

          {error && (
            <div style={S.errorBox}>
              <AlertCircle size={14} color="#DC2626" style={{ flexShrink: 0 }} />
              <p style={S.errorText}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={S.form}>
            {/* Email */}
            <div style={S.fieldWrap}>
              <label style={S.label}>Correo electrónico</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}><Mail size={15} /></span>
                <input
                  className="ls-input"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="tu@restaurante.com"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div style={S.fieldWrap}>
              <label style={S.label}>Contraseña</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}><Lock size={15} /></span>
                <input
                  className="ls-input pr"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  style={S.eyeBtn}
                  onClick={() => setShowPwd(v => !v)}
                  tabIndex={-1}
                  aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={S.submitBtn(loading)}
              className="ls-btn"
            >
              {loading ? (
                <>
                  <span style={S.spinner} />
                  Ingresando...
                </>
              ) : 'Continuar →'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={S.footer}>
          ¿Necesitas una cuenta?{' '}
          <a href="mailto:soporte@mastexopos.com" style={S.footerLink}>
            Contacta al administrador
          </a>
        </p>
      </div>
    </div>
  );
}
