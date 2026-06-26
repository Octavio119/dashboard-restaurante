import { useEffect } from 'react';

/**
 * Destino del redirect de Google OAuth (server/routes/oauth.js):
 * .../auth/callback?token=<JWT>&refresh=<JWT_refresh>
 *
 * Guarda ambos con las mismas claves que usa el login normal
 * (ver src/AuthContext.jsx: 'token' y 'refresh_token') y fuerza una
 * navegación dura a /dashboard. AuthContext arranca con 'token' en
 * localStorage: su efecto de montaje llama a api.me() para reconstruir
 * el `user`, y si encuentra 'refresh_token' programa la renovación
 * automática a los 55 min — igual que una sesión de email+password.
 */
export default function AuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refreshToken = params.get('refresh');
    if (!token) {
      window.location.href = '/login?error=oauth_failed';
      return;
    }
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    window.location.href = '/dashboard';
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0A0A12', color: 'rgba(255,255,255,0.60)', fontFamily: "'DM Sans', 'Inter', sans-serif",
    }}>
      Iniciando sesión...
    </div>
  );
}
