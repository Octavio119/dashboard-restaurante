import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, Wifi, CloudOff } from 'lucide-react';

/**
 * SyncBanner — appears at the top of the viewport when:
 *   a) the device is offline
 *   b) there are orders pending sync
 *
 * Props:
 *   isOnline      boolean
 *   pendingCount  number
 *   isSyncing     boolean
 *   syncNow       () => void
 */
export default function SyncBanner({ isOnline, pendingCount, isSyncing, syncNow }) {
  const showOffline = !isOnline;
  const showPending = isOnline && pendingCount > 0;
  const show        = showOffline || showPending;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={showOffline ? 'offline' : 'pending'}
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{   y: -56, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 px-4 py-2.5"
          style={{
            background: showOffline
              ? 'linear-gradient(90deg, #7F1D1D, #991B1B)'
              : 'linear-gradient(90deg, #78350F, #92400E)',
            borderBottom: `1px solid ${showOffline ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
          }}
        >
          {showOffline ? (
            <>
              <WifiOff size={15} className="shrink-0 text-red-300" />
              <p className="text-sm font-semibold text-red-200">
                Sin conexión — Los pedidos se guardan localmente y se enviarán al reconectar
              </p>
              <CloudOff size={13} className="shrink-0 text-red-400 ml-auto opacity-60" />
            </>
          ) : (
            <>
              <Wifi size={15} className="shrink-0 text-amber-300" />
              <p className="text-sm font-semibold text-amber-200">
                {pendingCount} pedido{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''} de sincronizar
              </p>
              <button
                onClick={syncNow}
                disabled={isSyncing}
                className="ml-auto flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shrink-0"
                style={{ background: 'rgba(245,158,11,0.25)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.4)' }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(245,158,11,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.25)'; }}
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Sincronizando…' : 'Sincronizar ahora'}
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
