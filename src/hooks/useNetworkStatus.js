import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import {
  getPendingOrders,
  markSynced,
  getPendingCount,
} from '../lib/offlineQueue';

/**
 * Tracks online/offline status and drives the sync queue.
 *
 * Returns:
 *   isOnline     — current navigator.onLine state (reactive)
 *   wasOffline   — true for one render cycle after coming back online
 *   pendingCount — number of orders in the offline queue (updates after sync)
 *   isSyncing    — sync in progress
 *   syncNow()    — manually trigger a sync attempt
 *   refreshPendingCount() — re-read IDB count without a full sync
 */
export function useNetworkStatus({ onSyncComplete, addToast } = {}) {
  const [isOnline,       setIsOnline]       = useState(navigator.onLine);
  const [wasOffline,     setWasOffline]      = useState(false);
  const [pendingCount,   setPendingCount]    = useState(0);
  const [isSyncing,      setIsSyncing]       = useState(false);

  // Track if we ever went offline so wasOffline can fire on reconnect
  const wentOfflineRef = useRef(false);

  // ── Refresh the IDB count ────────────────────────────────────────────────
  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount().catch(() => 0);
    setPendingCount(count);
  }, []);

  // ── Sync logic ───────────────────────────────────────────────────────────
  const syncNow = useCallback(async () => {
    if (isSyncing) return;
    const pending = await getPendingOrders().catch(() => []);
    if (!pending.length) { await refreshPendingCount(); return; }

    setIsSyncing(true);
    let successCount = 0;
    let failCount    = 0;

    for (const entry of pending) {
      try {
        await api.createPedido(entry.data);
        await markSynced(entry.queueId);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsSyncing(false);
    await refreshPendingCount();

    if (successCount > 0) {
      addToast?.(
        `${successCount} pedido${successCount > 1 ? 's' : ''} sincronizado${successCount > 1 ? 's' : ''} correctamente`,
        'success',
        { title: 'Sincronización completa' }
      );
      onSyncComplete?.();
    }
    if (failCount > 0) {
      addToast?.(
        `${failCount} pedido${failCount > 1 ? 's' : ''} no se pudo${failCount > 1 ? 'ron' : ''} sincronizar. Se reintentará más tarde.`,
        'warning',
        { title: 'Sincronización parcial' }
      );
    }
  }, [isSyncing, refreshPendingCount, addToast, onSyncComplete]);

  // ── Online / offline listeners ───────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wentOfflineRef.current) {
        setWasOffline(true);
        // Fire wasOffline for one render then clear
        setTimeout(() => setWasOffline(false), 5000);
        wentOfflineRef.current = false;
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      wentOfflineRef.current = true;
    };

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Auto-sync when coming back online ────────────────────────────────────
  useEffect(() => {
    if (isOnline && wentOfflineRef.current === false) {
      // Check if there are pending orders from a previous offline session
      getPendingOrders().then(pending => {
        if (pending.length > 0) syncNow();
      }).catch(() => {});
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Listen for SW SYNC_COMPLETE message ─────────────────────────────────
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        refreshPendingCount();
        onSyncComplete?.();
        addToast?.('Pedidos sincronizados por el sistema', 'success', { title: 'Sync automático' });
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleMessage);
  }, [refreshPendingCount, onSyncComplete, addToast]);

  // ── Trigger background sync when coming back online ──────────────────────
  useEffect(() => {
    if (!isOnline) return;
    navigator.serviceWorker?.ready.then(reg => {
      reg.sync?.register('sync-pedidos').catch(() => {});
    }).catch(() => {});
  }, [isOnline]);

  // ── Initial IDB count on mount ───────────────────────────────────────────
  useEffect(() => { refreshPendingCount(); }, [refreshPendingCount]);

  return {
    isOnline,
    wasOffline,
    pendingCount,
    isSyncing,
    syncNow,
    refreshPendingCount,
  };
}
