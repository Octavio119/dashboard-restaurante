import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export default function AdminCodeModal({ open, title, message, onConfirm, onCancel }) {
  const [code,    setCode]    = React.useState('');
  const [error,   setError]   = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) { setCode(''); setError(''); setLoading(false); }
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!code.trim()) { setError('Ingresa el código de administrador'); return; }
    setLoading(true);
    setError('');
    try {
      await onConfirm(code.trim());
    } catch (e) {
      setError(e.message || 'Código incorrecto');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity:0, scale:0.95 }}
        animate={{ opacity:1, scale:1 }}
        className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="font-black text-white text-base">{title}</h3>
            <p className="text-zinc-400 text-sm mt-0.5">{message}</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Código de administrador
          </label>
          <input
            type="password"
            value={code}
            onChange={e => { setCode(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            placeholder="••••••••"
            autoFocus
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-red-500/50 transition-colors"
          />
          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1.5 mt-0.5">
              <AlertTriangle size={12} /> {error}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors bg-red-500 hover:bg-red-400 text-white disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {loading ? 'Verificando...' : 'Confirmar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
