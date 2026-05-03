import { useEffect, useState } from 'react';
import { api } from '../api';
import { Key, Copy, Trash2, Plus, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function ApiKeysPage({ user }) {
  const plan = user?.restaurante?.plan;

  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState(null); // { id, key, nombre }
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [revoking, setRevoking] = useState(null); // id being revoked

  useEffect(() => {
    if (plan !== 'business') {
      setLoading(false);
      return;
    }
    api.getApiKeys()
      .then((data) => setKeys(Array.isArray(data) ? data : data.keys || []))
      .catch((e) => setError(e.message || 'Error al cargar API Keys'))
      .finally(() => setLoading(false));
  }, [plan]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);
    setError(null);
    setSuccess(null);
    setRevealedKey(null);
    try {
      const data = await api.createApiKey(newKeyName.trim());
      // Backend returns the raw key only on creation
      setRevealedKey({ id: data.id, key: data.key || data.raw_key, nombre: data.nombre });
      setKeys((prev) => [
        { id: data.id, nombre: data.nombre, created_at: data.created_at || new Date().toISOString() },
        ...prev,
      ]);
      setNewKeyName('');
      setSuccess('API Key creada. Cópiala ahora — no la podrás ver de nuevo.');
    } catch (e) {
      setError(e.message || 'Error al crear la API Key');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id, nombre) {
    if (!window.confirm(`¿Revocar la API Key "${nombre}"? Esta acción es irreversible.`)) return;
    setRevoking(id);
    setError(null);
    setSuccess(null);
    try {
      await api.revokeApiKey(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
      if (revealedKey?.id === id) setRevealedKey(null);
      setSuccess(`La API Key "${nombre}" fue revocada.`);
    } catch (e) {
      setError(e.message || 'Error al revocar la API Key');
    } finally {
      setRevoking(null);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Clave copiada al portapapeles.');
    });
  }

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  // Plan gate
  if (plan !== 'business') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '420px', width: '100%', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '40px 32px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Key size={26} color="#7c3aed" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 10px' }}>
            Solo disponible en Business
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 28px', lineHeight: 1.6 }}>
            Las API Keys para acceso programático solo están disponibles en el plan Business. Actualiza tu plan para integrar con sistemas externos.
          </p>
          <a
            href="/billing"
            style={{
              display: 'inline-block', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              color: '#fff', fontWeight: 700, fontSize: '14px', padding: '11px 28px',
              borderRadius: '8px', textDecoration: 'none', fontFamily: 'inherit',
            }}
          >
            Ver planes
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#64748b' }}>
          <svg width="24" height="24" style={{ animation: 'spin 0.8s linear infinite' }} fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: '14px' }}>Cargando API Keys...</span>
        </div>
      </div>
    );
  }

  const bannerBg = { success: '#f0fdf4', warning: '#fffbeb', error: '#fef2f2' };
  const bannerBorder = { success: '#86efac', warning: '#fcd34d', error: '#fca5a5' };
  const bannerColor = { success: '#166534', warning: '#92400e', error: '#991b1b' };
  const bannerIcon = { success: '✅', warning: '⚠️', error: '❌' };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .apikey-row:hover { background: #f8fafc !important; }
        .revoke-btn:hover { background: #fef2f2 !important; color: #dc2626 !important; }
        .copy-btn:hover { background: #eff6ff !important; }
        .create-btn:hover:not(:disabled) { opacity: 0.88; }
      `}</style>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
          <ArrowLeft size={15} /> Volver al dashboard
        </a>
        <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }} />
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>API Keys</h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Acceso programático para plan Business</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', background: '#faf5ff', color: '#7c3aed', border: '1px solid #e9d5ff', borderRadius: '100px', padding: '3px 10px' }}>
            <Key size={10} /> BUSINESS
          </span>
        </div>
      </div>

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Info Banner */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <AlertTriangle size={16} color="#1d4ed8" style={{ marginTop: '1px', flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: '#1e40af', margin: 0, lineHeight: 1.6 }}>
            <strong>Importante:</strong> Las API Keys permiten integrar MastexoPOS con sistemas externos. Guarda cada clave al crearla — no podrás verla de nuevo.
          </p>
        </div>

        {/* Success / Error banners */}
        {success && (
          <div style={{ background: bannerBg.success, border: `1px solid ${bannerBorder.success}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: bannerColor.success, fontSize: '14px', animation: 'fadeIn 0.2s ease' }}>
            <span>{bannerIcon.success}</span>
            <span style={{ fontWeight: 500, flex: 1 }}>{success}</span>
            <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: bannerColor.success, fontSize: '16px', lineHeight: 1, padding: 0 }}>×</button>
          </div>
        )}
        {error && (
          <div style={{ background: bannerBg.error, border: `1px solid ${bannerBorder.error}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: bannerColor.error, fontSize: '14px', animation: 'fadeIn 0.2s ease' }}>
            <span>{bannerIcon.error}</span>
            <span style={{ fontWeight: 500, flex: 1 }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: bannerColor.error, fontSize: '16px', lineHeight: 1, padding: 0 }}>×</button>
          </div>
        )}

        {/* Revealed key box */}
        {revealedKey && (
          <div style={{ background: '#fefce8', border: '1.5px solid #fde047', borderRadius: '12px', padding: '18px 20px', marginBottom: '24px', animation: 'fadeIn 0.25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Key size={15} color="#ca8a04" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#713f12' }}>
                Clave para "{revealedKey.nombre}" — cópiala ahora
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', border: '1px solid #fde047', borderRadius: '8px', padding: '10px 14px' }}>
              <code style={{ flex: 1, fontSize: '12px', fontFamily: "'Courier New', monospace", color: '#0f172a', wordBreak: 'break-all', letterSpacing: '0.02em' }}>
                {revealedKey.key}
              </code>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(revealedKey.key)}
                title="Copiar clave"
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#1d4ed8', fontFamily: 'inherit', transition: 'background 0.15s' }}
              >
                <Copy size={13} /> Copiar
              </button>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertTriangle size={11} /> Esta clave no se volverá a mostrar. Guárdala en un lugar seguro.
            </p>
          </div>
        )}

        {/* Create form */}
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} color="#7c3aed" /> Crear nueva API Key
          </h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Nombre / descripción
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Ej: Integración ERP, Delivery API..."
                maxLength={80}
                required
                style={{ width: '100%', height: '40px', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '0 12px', fontSize: '14px', color: '#0f172a', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={(e) => { e.target.style.borderColor = '#7c3aed'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
              />
            </div>
            <button
              type="submit"
              disabled={creating || !newKeyName.trim()}
              className="create-btn"
              style={{
                height: '40px', padding: '0 20px', borderRadius: '8px',
                background: creating || !newKeyName.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                color: creating || !newKeyName.trim() ? '#94a3b8' : '#fff',
                fontWeight: 700, fontSize: '14px', border: 'none',
                cursor: creating || !newKeyName.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px',
                whiteSpace: 'nowrap', transition: 'opacity 0.15s',
              }}
            >
              {creating ? (
                <>
                  <svg width="13" height="13" style={{ animation: 'spin 0.8s linear infinite' }} fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Creando...
                </>
              ) : (
                <><Plus size={14} /> Crear API Key</>
              )}
            </button>
          </form>
        </div>

        {/* Keys table */}
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={15} color="#7c3aed" />
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Claves activas
            </h2>
            <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', borderRadius: '100px', padding: '2px 10px' }}>
              {keys.length}
            </span>
          </div>

          {keys.length === 0 ? (
            /* Empty state */
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Key size={22} color="#cbd5e1" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 6px' }}>
                Sin API Keys activas
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                Crea tu primera clave para integrar MastexoPOS con sistemas externos.
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '10px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f1f5f9' }}>
                    Nombre
                  </th>
                  <th style={{ padding: '10px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f1f5f9' }}>
                    Creada el
                  </th>
                  <th style={{ padding: '10px 24px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f1f5f9' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k, i) => (
                  <tr
                    key={k.id}
                    className="apikey-row"
                    style={{ background: '#fff', transition: 'background 0.12s', borderBottom: i < keys.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                  >
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Key size={14} color="#7c3aed" />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{k.nombre}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: "'Courier New', monospace" }}>
                            {k.prefix ? `${k.prefix}•••` : `id: ${String(k.id).slice(0, 8)}…`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: '13px', color: '#64748b' }}>
                      {formatDate(k.created_at)}
                    </td>
                    <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                      <button
                        className="revoke-btn"
                        onClick={() => handleRevoke(k.id, k.nombre)}
                        disabled={revoking === k.id}
                        title="Revocar API Key"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px',
                          padding: '6px 12px', cursor: revoking === k.id ? 'not-allowed' : 'pointer',
                          fontSize: '12px', fontWeight: 600, color: '#ef4444',
                          fontFamily: 'inherit', transition: 'background 0.15s, color 0.15s',
                          opacity: revoking === k.id ? 0.5 : 1,
                        }}
                      >
                        {revoking === k.id ? (
                          <svg width="12" height="12" style={{ animation: 'spin 0.8s linear infinite' }} fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="#fca5a5" strokeWidth="3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <Trash2 size={12} />
                        )}
                        Revocar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer note */}
        <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '20px', lineHeight: 1.6 }}>
          Las API Keys se envían en el header <code style={{ fontFamily: "'Courier New', monospace", background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>X-API-Key</code> de cada request. Consulta la documentación en <a href="/api/docs" style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: 500 }}>/api/docs</a>.
        </p>
      </div>
    </div>
  );
}
