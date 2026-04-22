import React, { useState } from 'react';
import { Utensils, Mail, Lock, Eye, EyeOff, AlertCircle, ChefHat } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]   = useState('');
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

  const fillDemo = (email, password) => {
    setForm({ email, password });
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
      {/* Fondo sutil */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/4 rounded-full blur-[130px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Utensils size={26} className="text-black" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight">
              master<span className="text-amber-500">Growth</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">Dashboard de Restaurante</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-bold text-white">Iniciar sesión</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Accede al panel de control</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-xs font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="usuario@restaurante.com"
                  required
                  className="input w-full pl-10"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  required
                  className="input w-full pl-10 pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Ingresando...
                </>
              ) : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-600">
            ¿Necesitas una cuenta? Contacta al administrador.
          </p>
        </div>

        {/* Credenciales de acceso rápido */}
        <div className="mt-4 bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <ChefHat size={11} className="text-zinc-500" />
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Acceso rápido</p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin@restaurante.com', 'admin2024')}
              className="flex items-center justify-between text-left px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors group"
            >
              <span className="text-xs text-zinc-300 font-mono group-hover:text-white transition-colors">
                admin@restaurante.com
              </span>
              <span className="text-[9px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase">
                admin
              </span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('ocdeliciagoumetcl@gmail.com', 'admin2024')}
              className="flex items-center justify-between text-left px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors group"
            >
              <span className="text-xs text-zinc-300 font-mono group-hover:text-white transition-colors">
                ocdeliciagoumetcl@gmail.com
              </span>
              <span className="text-[9px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase">
                admin
              </span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('mario@restaurante.com', 'staff123')}
              className="flex items-center justify-between text-left px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors group"
            >
              <span className="text-xs text-zinc-300 font-mono group-hover:text-white transition-colors">
                mario@restaurante.com
              </span>
              <span className="text-[9px] bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded font-bold uppercase">
                chef
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
