import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger = true }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity:0, scale:0.95 }}
        animate={{ opacity:1, scale:1 }}
        className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${danger ? 'bg-red-500/10 text-red-400' : 'bg-[#8B5CF6]/10 text-[#8B5CF6]'}`}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-black text-white text-base">{title}</h3>
            <p className="text-zinc-400 text-sm mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-sm hover:bg-zinc-700 transition-colors">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${danger ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-[#8B5CF6] hover:brightness-110 text-white'}`}
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
