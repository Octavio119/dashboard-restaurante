import { useEffect } from 'react';

/** Carga Syne + DM Sans una sola vez por sesión */
export function useAuthFonts() {
  useEffect(() => {
    if (document.getElementById('auth-fonts')) return;
    const link = document.createElement('link');
    link.id  = 'auth-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);
}

/**
 * Fondo oscuro compartido entre Login y Register:
 * - bg #080714
 * - barra superior animada (#6C63FF)
 * - grid de puntos con movimiento continuo
 * - dos orbs flotantes con radial-gradient
 * Todos los keyframes viven aquí — Login y Register no los duplican.
 */
export default function AuthBackground({ children, style = {} }) {
  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      background: '#080714',
      overflow: 'hidden',
      ...style,
    }}>
      {/* ── Barra superior ── */}
      <div className="auth-topbar" style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '2px', background: '#6C63FF', transformOrigin: 'left',
        zIndex: 10,
      }} />

      {/* ── Grid animado ── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage:
          'linear-gradient(rgba(108,99,255,0.06) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(108,99,255,0.06) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        animation: 'authGridMove 20s linear infinite',
        pointerEvents: 'none',
      }} />

      {/* ── Orb arriba-izquierda ── */}
      <div style={{
        position: 'absolute', top: '-120px', left: '-120px',
        width: '420px', height: '420px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)',
        animation: 'authFloatA 7s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* ── Orb abajo-derecha ── */}
      <div style={{
        position: 'absolute', bottom: '-100px', right: '-100px',
        width: '360px', height: '360px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)',
        animation: 'authFloatB 9s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {children}

      <style>{`
        @keyframes authGridMove {
          from { background-position: 0 0; }
          to   { background-position: 40px 40px; }
        }
        @keyframes authFloatA {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-20px); }
        }
        @keyframes authFloatB {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(20px); }
        }
        @keyframes authTopBarIn {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes authRipple {
          from { transform: scale(0); opacity: 1; }
          to   { transform: scale(40); opacity: 0; }
        }
        .auth-topbar { animation: authTopBarIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
        @media (prefers-reduced-motion: reduce) {
          .auth-topbar { animation: none; }
          .anim-logo, .anim-title, .anim-subtitle,
          .anim-email, .anim-password, .anim-btn, .anim-badges,
          .anim-reg-logo, .anim-reg-steps, .anim-reg-social,
          .anim-reg-header, .anim-reg-form, .anim-reg-footer {
            animation: none; opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
