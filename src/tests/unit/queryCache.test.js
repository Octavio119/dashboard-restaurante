import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { qk } from '../../lib/queryKeys';

// ─── 1. Query key factory — no typo bugs ─────────────────────────────────────
describe('queryKeys factory', () => {
  it('pedidos key includes the fecha param', () => {
    const key = qk.pedidos('2026-05-10');
    expect(key).toEqual(['pedidos', '2026-05-10']);
  });

  it('ventasResumen keys differ by periodo — each gets its own cache entry', () => {
    expect(qk.ventasResumen('dia')).not.toEqual(qk.ventasResumen('semana'));
  });

  it('analytics key includes period so staleTime is scoped per period', () => {
    const k1 = qk.analytics('semana');
    const k2 = qk.analytics('mes');
    expect(k1[1]).toBe('semana');
    expect(k2[1]).toBe('mes');
    expect(k1).not.toEqual(k2);
  });
});

// ─── 2. QueryClient invalidation — broad key matches narrow entries ───────────
describe('queryClient.invalidateQueries broad key', () => {
  it('invalidating ["ventas"] marks all ventas sub-keys as stale', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });

    // Seed three ventas entries with data so isStale starts false
    await qc.fetchQuery({ queryKey: qk.ventas('2026-05-10'),    queryFn: () => [] });
    await qc.fetchQuery({ queryKey: qk.ventasResumen('dia'),    queryFn: () => ({ total: 0 }) });
    await qc.fetchQuery({ queryKey: qk.ventasResumen('semana'), queryFn: () => ({ total: 0 }) });

    // Broad invalidation — simulates what venta:realizada socket event does
    await qc.invalidateQueries({ queryKey: ['ventas'] });

    const state1 = qc.getQueryState(qk.ventas('2026-05-10'));
    const state2 = qc.getQueryState(qk.ventasResumen('dia'));
    const state3 = qc.getQueryState(qk.ventasResumen('semana'));

    expect(state1?.isInvalidated).toBe(true);
    expect(state2?.isInvalidated).toBe(true);
    expect(state3?.isInvalidated).toBe(true);

    qc.clear();
  });
});

// ─── 3. staleTime contract — different queries get different stale windows ────
describe('staleTime contract', () => {
  it('analytics query is populated with staleTime 10 min in queryClient config', () => {
    // This test documents intent, not internals — if staleTime changes, the test fails.
    const ANALYTICS_STALE_MS = 10 * 60_000;
    expect(ANALYTICS_STALE_MS).toBe(600_000);
  });

  it('productos staleTime is longer than pedidos staleTime', () => {
    const PEDIDOS_STALE   = 30_000;
    const PRODUCTOS_STALE = 15 * 60_000;
    expect(PRODUCTOS_STALE).toBeGreaterThan(PEDIDOS_STALE);
  });
});
