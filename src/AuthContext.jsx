import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const refreshTimer          = useRef(null);

  const doLogout = useCallback(async (callServer = false) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    if (callServer) { try { await api.logout(); } catch {} }
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // Programa renovación del access token 5 min antes de expirar (token dura 1h)
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(async () => {
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) { doLogout(); return; }
        const data = await api.refreshToken(refreshToken);
        localStorage.setItem('token', data.token);
        localStorage.setItem('refresh_token', data.refresh_token);
        scheduleRefresh();
      } catch {
        doLogout();
      }
    }, 55 * 60 * 1000); // 55 min
  }, [doLogout]);

  // Verificar token al cargar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    api.me()
      .then(u => {
        setUser(u);
        localStorage.setItem('user', JSON.stringify(u));
        scheduleRefresh();
      })
      .catch(async () => {
        // Access token expirado — intentar refresh
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) { doLogout(); setLoading(false); return; }
        try {
          const data = await api.refreshToken(refreshToken);
          localStorage.setItem('token', data.token);
          localStorage.setItem('refresh_token', data.refresh_token);
          const u = await api.me();
          setUser(u);
          localStorage.setItem('user', JSON.stringify(u));
          scheduleRefresh();
        } catch {
          doLogout();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Escuchar evento de logout automático (401 en cualquier request)
  useEffect(() => {
    const handler = () => doLogout();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [doLogout]);

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    scheduleRefresh();
    return data.user;
  }, [scheduleRefresh]);

  const logout = useCallback(() => doLogout(true), [doLogout]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    return api.changePassword(currentPassword, newPassword);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
