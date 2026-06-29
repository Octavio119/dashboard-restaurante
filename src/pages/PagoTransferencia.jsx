import { useState } from 'react';
import { ArrowLeft, Copy, Check, UploadCloud } from 'lucide-react';
import { api } from '../api';
import { PLANS } from '../config/plans';

const DATOS_BANCARIOS = [
  { label: 'Banco',  value: 'Banco Estado' },
  { label: 'RUT',    value: '26.188.041-5' },
  { label: 'Tipo',   value: 'Cuenta Corriente' },
  { label: 'Número', value: '38100347528' },
  { label: 'Email',  value: 'hola@mastexopos.com' },
];

const MAX_FILE_MB = 5;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PagoTransferencia({ user }) {
  const [plan,        setPlan]        = useState('pro');
  const [nombre,       setNombre]      = useState(user?.nombre || '');
  const [email,        setEmail]       = useState(user?.email || '');
  const [file,         setFile]        = useState(null);
  const [copiedField,  setCopiedField] = useState(null);
  const [sending,      setSending]     = useState(false);
  const [error,        setError]       = useState(null);
  const [success,      setSuccess]     = useState(false);

  function copy(field, value) {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    });
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`El archivo no puede superar ${MAX_FILE_MB}MB.`);
      return;
    }
    setError(null);
    setFile(f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) { setError('Sube el comprobante de la transferencia.'); return; }
    setSending(true);
    setError(null);
    try {
      const comprobante = await fileToDataUrl(file);
      await api.enviarComprobantePago({ plan, nombre, email, comprobante });
      setSuccess(true);
    } catch (e) {
      setError(e.message || 'No se pudo enviar el comprobante. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
        <div style={{ textAlign: 'center', maxWidth: '420px', padding: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>✓</div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
            Comprobante recibido. Te activaremos en 24hs.
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px' }}>
            Revisaremos tu transferencia y activaremos el plan {PLANS[plan]?.name} en tu cuenta.
          </p>
          <a href="/dashboard" style={{ fontSize: '13px', color: '#0066CC', fontWeight: 600, textDecoration: 'none' }}>
            Volver al dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/billing" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
          <ArrowLeft size={15} /> Volver a planes
        </a>
        <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }} />
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Pago por transferencia</h1>
      </div>

      <div className="pago-transferencia-grid" style={{
        maxWidth: '900px', margin: '0 auto', padding: '32px 24px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px',
      }}>
        {/* Datos bancarios */}
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0D1B3E', margin: '0 0 16px' }}>
            Datos para transferencia
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {DATOS_BANCARIOS.map((d) => (
              <div key={d.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', background: '#f8fafc', borderRadius: '8px',
              }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{d.label}</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#0f172a', fontWeight: 600 }}>{d.value}</p>
                </div>
                <button
                  onClick={() => copy(d.label, d.value)}
                  style={{
                    border: 'none', background: 'none', cursor: 'pointer',
                    color: copiedField === d.label ? '#22c55e' : '#94a3b8', padding: '6px',
                    display: 'flex', alignItems: 'center',
                  }}
                  title={`Copiar ${d.label}`}
                >
                  {copiedField === d.label ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '16px', fontSize: '12px', color: '#94a3b8' }}>
            Una vez hecha la transferencia, sube el comprobante en el formulario y te activaremos el plan en menos de 24hs.
          </p>
        </div>

        {/* Formulario */}
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0D1B3E', margin: '0 0 16px' }}>
            Sube tu comprobante
          </h2>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Plan</span>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                style={{ height: '40px', borderRadius: '8px', border: '1.5px solid #e2e8f0', padding: '0 12px', fontSize: '14px', fontFamily: 'inherit' }}
              >
                <option value="pro">Pro (${PLANS.pro.price}/mes)</option>
                <option value="business">Business (${PLANS.business.price}/mes)</option>
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Nombre completo</span>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                style={{ height: '40px', borderRadius: '8px', border: '1.5px solid #e2e8f0', padding: '0 12px', fontSize: '14px', fontFamily: 'inherit' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Email de contacto</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ height: '40px', borderRadius: '8px', border: '1.5px solid #e2e8f0', padding: '0 12px', fontSize: '14px', fontFamily: 'inherit' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Subir comprobante</span>
              <div style={{
                border: '1.5px dashed #cbd5e1', borderRadius: '8px', padding: '16px',
                display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
              }}>
                <UploadCloud size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  required
                  style={{ fontSize: '13px', fontFamily: 'inherit' }}
                />
              </div>
              {file && <span style={{ fontSize: '12px', color: '#22c55e' }}>{file.name}</span>}
            </label>

            <button
              type="submit"
              disabled={sending}
              style={{
                height: '44px', borderRadius: '8px', border: 'none', marginTop: '8px',
                background: sending ? '#94a3b8' : '#0066CC', color: '#fff',
                fontWeight: 700, fontSize: '14px', cursor: sending ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {sending ? 'Enviando...' : 'Enviar comprobante'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .pago-transferencia-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
