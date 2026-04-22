import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const TOAST_STYLES = {
  success: 'bg-green-950/95  border-green-500/40  text-green-200',
  warning: 'bg-yellow-950/95 border-yellow-500/40 text-yellow-200',
  error:   'bg-red-950/95    border-red-500/40    text-red-200',
  info:    'bg-zinc-900/95   border-zinc-700      text-white',
};

export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{ opacity:0, x:80, scale:0.92 }}
            animate={{ opacity:1, x:0,  scale:1 }}
            exit={{    opacity:0, x:80, scale:0.92 }}
            transition={{ duration:0.18 }}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium min-w-72 max-w-sm ${TOAST_STYLES[t.type] || TOAST_STYLES.info}`}>
            {t.icon && <span className="text-base mt-0.5 shrink-0 select-none">{t.icon}</span>}
            <div className="flex-1 min-w-0">
              {t.title && <p className="font-black text-[10px] uppercase tracking-wider opacity-60 mb-0.5">{t.title}</p>}
              <p className="leading-snug text-[13px]">{t.message}</p>
            </div>
            <button onClick={() => onRemove(t.id)} className="shrink-0 opacity-40 hover:opacity-80 transition-opacity mt-0.5 ml-1">
              <X size={12}/>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
