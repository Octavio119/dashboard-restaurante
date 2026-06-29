import { useEffect, useMemo, useState } from 'react';

const BASE = import.meta.env.VITE_BACKEND_URL || '/api';

const PLAN_BADGE = {
  trial:     { bg: '#fef9c3', color: '#854d0e', label: 'Trial' },
  pro:       { bg: '#dcfce7', color: '#166534', label: 'Pro' },
  business:  { bg: '#dbeafe', color: '#1e40af', label: 'Business' },
  cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};

const FILTROS = [
  { key: 'todos',         label: 'Todos' },
  { key: 'trial_activo',  label: 'Trial activo' },
  { key: 'trial_vencido', label: 'Trial vencido' },
  { key: 'pro',           label: 'Pro' },
  { key: 'business',      label: 'Business' },
  { key: 'cancelled',     label: 'Cancelled' },
];

function isTrialExpired(r) {
  return r.plan === 'trial' && r.trial_ends_at && new Date(r.trial_ends_at) < new Date();
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminPanel() {
  const [code,        setCode]        = useState(() => new URLSearchParams(window.location.search).get('code') || '');
  const [inputCode,   setInputCode]   = useState('');
  const [restaurantes, setRestaurantes] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [filtro,      setFiltro]      = useState('todos');
  const [updating,    setUpdating]    = useState(null);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError(null);
    fetch(`${BASE}/admin/restaurantes`, { headers: { 'x-admin-code': code } })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Código inválido');
        setRestaurantes(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [code]);

  function handleEnter(e) {
    e.preventDefault();
    if (!inputCode.trim()) return;
    window.history.replaceState({}, '', `/admin?code=${encodeURIComponent(inputCode.trim())}`);
    setCode(inputCode.trim());
  }

  async function handlePlanChange(id, nuevoPlan) {
    setUpdating(id);
    setError(null);
    try {
      const res = await fetch(`${BASE}/admin/restaurantes/${id}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-code': code },
        body: JSON.stringify({ plan: nuevoPlan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error al cambiar el plan');
      setRestaurantes((prev) => prev.map((r) => r.id === id
        ? { ...r, plan: nuevoPlan, trial_ends_at: data.restaurante?.trial_ends_at ?? r.trial_ends_at }
        : r));
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdating(null);
    }
  }

  const filtered = useMemo(() => restaurantes.filter((r) => {
    switch (filtro) {
      case 'trial_activo':  return r.plan === 'trial' && !isTrialExpired(r);
      case 'trial_vencido': return isTrialExpired(r);
      case 'pro':           return r.plan === 'pro';
      case 'business':      return r.plan === 'business';
      case 'cancelled':     return r.plan === 'cancelled';
      default:              return true;
    }
  }), [restaurantes, filtro]);

  const stats = useMemo(() => ({
    total:       restaurantes.length,
    trialActivo: restaurantes.filter((r) => r.plan === 'trial' && !isTrialExpired(r)).length,
    pagando:     restaurantes.filter((r) => r.plan === 'pro' || r.plan === 'business').length,
    vencidos:    restaurantes.filter((r) => r.plan === 'cancelled' || isTrialExpired(r)).length,
  }), [restaurantes]);

  // ── Pantalla de código ────────────────────────────────────────────────────
  if (!code) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
        <form onSubmit={handleEnter} style={{ background: '#1e293b', padding: '32px', borderRadius: '14px', width: '320px' }}>
          <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>Panel de administrador</h1>
          <input
            type="password"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Código de administrador"
            autoFocus
            style={{ width: '100%', height: '42px', borderRadius: '8px', border: 'none', padding: '0 12px', marginBottom: '12px', fontSize: '14px', boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ width: '100%', height: '42px', borderRadius: '8px', border: 'none', background: '#8B5CF6', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif", padding: '32px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>Panel de administrador</h1>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Total registrados',  value: stats.total },
            { label: 'En trial activo',    value: stats.trialActivo },
            { label: 'Pagando (Pro+Biz)',  value: stats.pagando },
            { label: 'Vencidos/cancelled', value: stats.vencidos },
          ].map((s) => (
            <div key={s.label} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {FILTROS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              style={{
                border: filtro === f.key ? '1.5px solid #8B5CF6' : '1.5px solid #e2e8f0',
                background: filtro === f.key ? '#f5f3ff' : '#fff',
                color: filtro === f.key ? '#6d28d9' : '#475569',
                borderRadius: '100px', padding: '6px 14px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Tabla */}
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <p style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>Cargando...</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>Sin resultados para este filtro.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  {['Restaurante', 'Email admin', 'Plan', 'Trial vence', 'Pedidos', 'Registro', 'Acción'].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', fontWeight: 600, color: '#64748b', fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const badge   = PLAN_BADGE[r.plan] || PLAN_BADGE.cancelled;
                  const vencido = isTrialExpired(r);
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: '#0f172a' }}>{r.nombre}</td>
                      <td style={{ padding: '10px 16px', color: '#475569' }}>{r.email_admin || '—'}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ background: badge.bg, color: badge.color, borderRadius: '100px', padding: '3px 10px', fontSize: '11px', fontWeight: 700 }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', color: vencido ? '#dc2626' : '#475569', fontWeight: vencido ? 700 : 400 }}>
                        {r.plan === 'trial' ? (vencido ? 'Vencido' : formatDate(r.trial_ends_at)) : '—'}
                      </td>
                      <td style={{ padding: '10px 16px', color: '#475569' }}>{r.pedidos_totales}</td>
                      <td style={{ padding: '10px 16px', color: '#475569' }}>{formatDate(r.created_at)}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <select
                          value={r.plan}
                          disabled={updating === r.id}
                          onChange={(e) => handlePlanChange(r.id, e.target.value)}
                          style={{ fontSize: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '4px 8px', fontFamily: 'inherit' }}
                        >
                          <option value="trial">Trial</option>
                          <option value="pro">Pro</option>
                          <option value="business">Business</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
