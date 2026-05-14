import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, AlertTriangle, TrendingUp, Lightbulb,
  RefreshCw, Zap, WifiOff, Lock,
} from 'lucide-react';
import { api } from '../../../api';

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  warning: {
    icon:       AlertTriangle,
    color:      '#F59E0B',
    bg:         'rgba(245,158,11,0.07)',
    border:     'rgba(245,158,11,0.18)',
    badgeBg:    'rgba(245,158,11,0.12)',
    badgeColor: '#FCD34D',
    label:      'Atención',
  },
  opportunity: {
    icon:       Lightbulb,
    color:      '#10B981',
    bg:         'rgba(16,185,129,0.07)',
    border:     'rgba(16,185,129,0.18)',
    badgeBg:    'rgba(16,185,129,0.12)',
    badgeColor: '#34D399',
    label:      'Oportunidad',
  },
  trend: {
    icon:       TrendingUp,
    color:      '#3B82F6',
    bg:         'rgba(59,130,246,0.07)',
    border:     'rgba(59,130,246,0.18)',
    badgeBg:    'rgba(59,130,246,0.12)',
    badgeColor: '#93C5FD',
    label:      'Tendencia',
  },
};

const STALE_6H = 6 * 60 * 60 * 1000;

// ── Skeleton ──────────────────────────────────────────────────────────────────
function InsightSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div
            className="shrink-0 w-8 h-8 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)', animation: `skeleton-shimmer 1.6s ease-in-out ${i * 0.18}s infinite` }}
          />
          <div className="flex-1 flex flex-col gap-2 pt-0.5">
            <div
              className="h-3 rounded-full"
              style={{ width: '55%', background: 'rgba(255,255,255,0.04)', animation: `skeleton-shimmer 1.6s ease-in-out ${i * 0.18}s infinite` }}
            />
            <div
              className="h-2.5 rounded-full"
              style={{ width: '90%', background: 'rgba(255,255,255,0.03)', animation: `skeleton-shimmer 1.6s ease-in-out ${i * 0.18 + 0.08}s infinite` }}
            />
            <div
              className="h-2.5 rounded-full"
              style={{ width: '70%', background: 'rgba(255,255,255,0.03)', animation: `skeleton-shimmer 1.6s ease-in-out ${i * 0.18 + 0.16}s infinite` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Single insight card ───────────────────────────────────────────────────────
function InsightCard({ insight, index }) {
  const cfg = TYPE_CONFIG[insight.type] || TYPE_CONFIG.trend;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.22, ease: 'easeOut' }}
      className="flex items-start gap-3 rounded-xl p-4 transition-colors"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {/* Icon */}
      <div
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
        style={{ background: `${cfg.color}18` }}
      >
        <Icon size={15} style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13px] font-semibold text-zinc-100 leading-tight">
            {insight.title}
          </p>
          <span
            className="shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
            style={{ background: cfg.badgeBg, color: cfg.badgeColor }}
          >
            {cfg.label}
          </span>
        </div>
        <p className="text-[12px] text-zinc-400 mt-1 leading-relaxed">
          {insight.description}
        </p>
        {insight.action && (
          <div className="flex items-start gap-1.5 mt-2">
            <Zap size={11} className="shrink-0 mt-0.5" style={{ color: cfg.color }} />
            <p className="text-[11px] font-medium leading-relaxed" style={{ color: cfg.color }}>
              {insight.action}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Error / empty states ──────────────────────────────────────────────────────
function PlanGate() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
        <Lock size={16} style={{ color: '#8B5CF6' }} />
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-300">Requiere plan Pro</p>
        <p className="text-xs text-zinc-500 mt-1">Los insights de IA están disponibles desde el plan Pro.</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <WifiOff size={20} className="text-zinc-600" />
      <div>
        <p className="text-sm font-semibold text-zinc-400">No se pudieron cargar los insights</p>
        <p className="text-xs text-zinc-600 mt-1">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="text-xs text-violet-400 hover:text-violet-300 transition-colors underline cursor-pointer"
      >
        Reintentar
      </button>
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────
export default function AIInsightsWidget() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-insights'],
    queryFn:  () => api.getAIInsights(false),
    staleTime: STALE_6H,
    retry: 1,
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Invalidate and re-fetch with ?refresh=true (bypasses server cache)
      await queryClient.fetchQuery({
        queryKey: ['ai-insights'],
        queryFn:  () => api.getAIInsights(true),
        staleTime: 0,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const isPlanError = error?.message?.includes('plan_required') ||
                      error?.message?.includes('Plan requerido') ||
                      error?.message?.includes('pro');

  const generatedAt = data?.generated_at
    ? new Date(data.generated_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div
      className="rounded-2xl flex flex-col gap-4"
      style={{
        background: 'linear-gradient(145deg, #0D0D1A 0%, #0F0F1C 100%)',
        border: '1px solid rgba(139,92,246,0.15)',
        padding: '20px 20px 18px',
        boxShadow: '0 0 0 1px rgba(139,92,246,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(109,40,217,0.15))' }}
          >
            <Sparkles size={14} style={{ color: '#A78BFA' }} />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-zinc-100 leading-tight">
              Insights IA
            </h3>
            {generatedAt && !isLoading && (
              <p className="text-[10px] text-zinc-600 mt-0.5">
                {data?.source === 'ai' ? '✦ Claude · ' : ''}
                actualizado {generatedAt}
                {data?.from_cache && ' · en caché'}
              </p>
            )}
          </div>
        </div>

        {/* Refresh button */}
        {!isPlanError && (
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            title="Actualizar análisis (bypass caché)"
            className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            style={{ color: '#A78BFA', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(139,92,246,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)'; }}
          >
            <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Analizando…' : 'Actualizar'}
          </button>
        )}
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait" initial={false}>
        {isLoading || isRefreshing ? (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <InsightSkeleton />
          </motion.div>
        ) : isPlanError ? (
          <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PlanGate />
          </motion.div>
        ) : error ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ErrorState message={error.message} onRetry={refetch} />
          </motion.div>
        ) : data?.insights?.length > 0 ? (
          <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2.5">
            {data.insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} index={i} />
            ))}
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-sm text-zinc-500 text-center py-6">Sin datos suficientes para generar insights.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
