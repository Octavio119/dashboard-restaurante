import React, { useState } from 'react';
import { api } from '../api';

// ─── OnboardingWizard ──────────────────────────────────────────────────────────
// Shows a 3-step setup wizard when a new restaurant has no products/categories.
// Props: { user, onComplete, onDismiss }
// ──────────────────────────────────────────────────────────────────────────────

const PRIMARY   = '#0066CC';
const PRIMARY_H = '#0052A3';
const RADIUS    = 16;

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  card: {
    background: '#ffffff',
    borderRadius: RADIUS,
    boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
    width: '100%',
    maxWidth: 480,
    padding: '40px',
    position: 'relative',
    color: '#111827',
  },
  dismissBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9CA3AF',
    padding: 6,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    fontSize: 20,
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: (active, done) => ({
    width: active ? 32 : 10,
    height: 10,
    borderRadius: 6,
    background: done || active ? PRIMARY : '#E5E7EB',
    transition: 'width 0.25s ease, background 0.25s ease',
  }),
  stepLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 22,
    fontWeight: 800,
    marginBottom: 6,
    lineHeight: 1.2,
    color: '#111827',
  },
  subheading: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 28,
    lineHeight: 1.5,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #E5E7EB',
    borderRadius: 10,
    fontSize: 14,
    color: '#111827',
    outline: 'none',
    background: '#F9FAFB',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  inputFocus: {
    borderColor: PRIMARY,
    background: '#fff',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  primaryBtn: (disabled) => ({
    width: '100%',
    padding: '12px 20px',
    background: disabled ? '#9CA3AF' : PRIMARY,
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    marginTop: 8,
    transition: 'background 0.15s',
  }),
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: '#DCFCE7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    fontSize: 30,
  },
  successText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 1.6,
    marginBottom: 28,
  },
  errorMsg: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 6,
    background: '#FEF2F2',
    borderRadius: 8,
    padding: '8px 12px',
  },
};

// ─── Focusable Input ──────────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, min }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        style={{ ...styles.input, ...(focused ? styles.inputFocus : {}) }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

// ─── Progress Dots ────────────────────────────────────────────────────────────
function ProgressDots({ step, total }) {
  return (
    <div>
      <div style={styles.progressRow}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={styles.dot(i === step, i < step)} />
        ))}
      </div>
      <p style={styles.stepLabel}>Paso {step + 1} de {total}</p>
    </div>
  );
}

// ─── Step 1 — Crear primera categoría ─────────────────────────────────────────
function Step1({ onNext }) {
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    const trimmed = nombre.trim();
    if (!trimmed) { setError('El nombre de la categoría es obligatorio.'); return; }
    setLoading(true);
    setError('');
    try {
      const categoria = await api.createCategoria(trimmed);
      onNext(categoria);
    } catch (e) {
      setError(e.message || 'Error al crear la categoría.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={styles.heading}>Crear primera categoría</h2>
      <p style={styles.subheading}>
        Las categorías organizan tu menú. Por ejemplo: "Entradas", "Platos principales", "Bebidas".
      </p>

      <Field
        label="Nombre de la categoría"
        value={nombre}
        onChange={setNombre}
        placeholder="Ej. Platos principales"
      />

      {error && <p style={styles.errorMsg}>{error}</p>}

      <button
        style={styles.primaryBtn(loading || !nombre.trim())}
        disabled={loading || !nombre.trim()}
        onClick={handleCreate}
      >
        {loading ? 'Creando...' : 'Crear categoría →'}
      </button>
    </div>
  );
}

// ─── Step 2 — Crear primer producto ──────────────────────────────────────────
function Step2({ categoria, onNext }) {
  const [form, setForm] = useState({
    nombre: '',
    precio: '',
    stock: '',
    unidad: 'unidad',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

  const isValid = form.nombre.trim() && Number(form.precio) > 0;

  const handleCreate = async () => {
    if (!isValid) { setError('Nombre y precio son obligatorios.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.createProducto({
        nombre: form.nombre.trim(),
        precio: parseFloat(form.precio),
        categoria: categoria?.nombre || '',
        stock: form.stock !== '' ? parseInt(form.stock, 10) : 0,
        unidad: form.unidad.trim() || 'unidad',
      });
      onNext();
    } catch (e) {
      setError(e.message || 'Error al crear el producto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={styles.heading}>Crear primer producto</h2>
      <p style={styles.subheading}>
        Agrega un ítem a tu menú bajo la categoría <strong style={{ color: PRIMARY }}>"{categoria?.nombre}"</strong>.
      </p>

      <Field
        label="Nombre del producto"
        value={form.nombre}
        onChange={set('nombre')}
        placeholder="Ej. Pollo a la parrilla"
      />
      <Field
        label="Precio"
        type="number"
        min="0"
        value={form.precio}
        onChange={set('precio')}
        placeholder="Ej. 12.99"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={styles.fieldGroup}>
          <Field
            label="Stock inicial"
            type="number"
            min="0"
            value={form.stock}
            onChange={set('stock')}
            placeholder="0"
          />
        </div>
        <div style={styles.fieldGroup}>
          <Field
            label="Unidad"
            value={form.unidad}
            onChange={set('unidad')}
            placeholder="unidad"
          />
        </div>
      </div>

      {error && <p style={styles.errorMsg}>{error}</p>}

      <button
        style={styles.primaryBtn(loading || !isValid)}
        disabled={loading || !isValid}
        onClick={handleCreate}
      >
        {loading ? 'Creando...' : 'Crear producto →'}
      </button>
    </div>
  );
}

// ─── Step 3 — Listo ───────────────────────────────────────────────────────────
function Step3({ onComplete }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={styles.successIcon}>✓</div>
      <h2 style={{ ...styles.heading, textAlign: 'center' }}>¡Listo para operar!</h2>
      <p style={styles.successText}>
        Tu restaurante está configurado. Puedes crear tu primer pedido y empezar a gestionar tu negocio.
      </p>
      <button
        style={styles.primaryBtn(false)}
        onClick={onComplete}
      >
        Ir al dashboard
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OnboardingWizard({ user, onComplete, onDismiss }) {
  const [step, setStep] = useState(0);
  const [createdCategoria, setCreatedCategoria] = useState(null);

  const TOTAL_STEPS = 3;

  const handleDismiss = () => {
    if (user?.restaurante_id) {
      localStorage.setItem(`onboarding_dismissed_${user.restaurante_id}`, '1');
    }
    onDismiss?.();
  };

  const handleStep1Done = (categoria) => {
    setCreatedCategoria(categoria);
    setStep(1);
  };

  const handleStep2Done = () => {
    setStep(2);
  };

  const handleComplete = () => {
    if (user?.restaurante_id) {
      localStorage.setItem(`onboarding_dismissed_${user.restaurante_id}`, '1');
    }
    onComplete?.();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Dismiss button — only show on steps 0 and 1 */}
        {step < 2 && (
          <button
            style={styles.dismissBtn}
            onClick={handleDismiss}
            title="Cerrar"
            aria-label="Cerrar asistente de configuración"
          >
            ×
          </button>
        )}

        <ProgressDots step={step} total={TOTAL_STEPS} />

        {step === 0 && (
          <Step1 onNext={handleStep1Done} />
        )}

        {step === 1 && (
          <Step2 categoria={createdCategoria} onNext={handleStep2Done} />
        )}

        {step === 2 && (
          <Step3 onComplete={handleComplete} />
        )}
      </div>
    </div>
  );
}
