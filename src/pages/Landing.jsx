import { useState, useEffect, useRef } from 'react';
import logo from '../../assets/logo.png';
import './landing.css';
import PayPalButton from '../components/PayPalButton';
import { api } from '../api';

const STAR = (
  <svg className="star-svg" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const STARS = <div className="tcard-stars" aria-label="5 de 5 estrellas">{STAR}{STAR}{STAR}{STAR}{STAR}</div>;

const VERIFIED_ICON = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const CHECK_ICON = (
  <svg className="fi on" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const X_ICON = (
  <svg className="fi off" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ─── Modal de pago rápido desde la landing ───────────────────────────────────
const PLAN_PRICES = { pro: '$29', business: '$79' };
const PLAN_LABELS = { pro: 'Pro', business: 'Business' };

function QuickPayModal({ plan, onClose }) {
  const [step,       setStep]       = useState('form'); // 'form' | 'paying' | 'success' | 'error'
  const [nombre,     setNombre]     = useState('');
  const [email,      setEmail]      = useState('');
  const [restaurante,setRestaurante]= useState('');
  const [password,   setPassword]   = useState('');
  const [err,        setErr]        = useState('');
  const [loading,    setLoading]    = useState(false);

  async function handleContinue(e) {
    e.preventDefault();
    setErr('');
    if (!restaurante.trim() || restaurante.trim().length < 2) { setErr('Escribe el nombre del restaurante (mínimo 2 caracteres)'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))     { setErr('Email inválido'); return; }
    if (password.length < 8)                                    { setErr('La contraseña debe tener al menos 8 caracteres'); return; }

    setLoading(true);
    try {
      const data = await api.signup(restaurante.trim(), email.trim().toLowerCase(), password, nombre.trim() || restaurante.trim());
      localStorage.setItem('token',         data.token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user',          JSON.stringify(data.user));
      setStep('paying');
    } catch (e) {
      const msg = e?.message || '';
      if (msg.includes('ya registrado') || msg.includes('Email') || msg.includes('existe')) {
        setErr('Este email ya tiene una cuenta. ¿Deseas iniciar sesión?');
      } else {
        setErr(msg || 'Error al crear la cuenta. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (step === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          ¡Plan {PLAN_LABELS[plan]} activado!
        </h3>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
          Tu cuenta está lista. Entrando al dashboard...
        </p>
      </div>
    );
  }

  const font = "'Plus Jakarta Sans', -apple-system, sans-serif";
  const color = plan === 'pro' ? '#0066CC' : '#7c3aed';

  return (
    <div style={{ fontFamily: font }}>
      {/* Resumen del plan */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a', margin: 0 }}>Plan {PLAN_LABELS[plan]}</p>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>Mensual · cancela cuando quieras</p>
        </div>
        <p style={{ fontWeight: 800, fontSize: '24px', color: '#0f172a', margin: 0 }}>{PLAN_PRICES[plan]}<span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 400 }}>/mes</span></p>
      </div>

      {step === 'form' && (
        <form onSubmit={handleContinue} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            placeholder="Nombre del restaurante *"
            value={restaurante} onChange={e => setRestaurante(e.target.value)}
            style={inputStyle(color)}
          />
          <input
            type="email" placeholder="Tu email *"
            value={email} onChange={e => setEmail(e.target.value)}
            style={inputStyle(color)}
          />
          <input
            placeholder="Tu nombre (opcional)"
            value={nombre} onChange={e => setNombre(e.target.value)}
            style={inputStyle(color)}
          />
          <input
            type="password" placeholder="Contraseña (mín. 8 caracteres) *"
            value={password} onChange={e => setPassword(e.target.value)}
            style={inputStyle(color)}
          />
          {err && (
            <p style={{ color: '#dc2626', fontSize: '12px', margin: 0, background: '#fef2f2', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
              {err}
            </p>
          )}
          <button type="submit" disabled={loading} style={{
            height: '48px', borderRadius: '10px', background: loading ? '#94a3b8' : color,
            color: '#fff', fontWeight: 700, fontSize: '15px', border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: font,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            {loading ? 'Creando cuenta...' : 'Continuar al pago →'}
          </button>
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            ¿Ya tienes cuenta? <a href="/login" style={{ color, fontWeight: 600 }}>Inicia sesión</a>
          </p>
        </form>
      )}

      {step === 'paying' && (
        <div>
          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px', textAlign: 'center' }}>
            Cuenta creada para <strong>{email}</strong>. Completa el pago:
          </p>
          {err && (
            <p style={{ color: '#dc2626', fontSize: '12px', margin: '0 0 12px', background: '#fef2f2', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
              {err}
            </p>
          )}
          <PayPalButton
            plan={plan}
            onSuccess={({ plan: activatedPlan }) => {
              setStep('success');
              setTimeout(() => { window.location.href = `/dashboard?upgraded=true&plan=${activatedPlan}`; }, 2000);
            }}
            onError={(msg) => setErr(msg)}
          />
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>
            🔒 Pago seguro via PayPal
          </p>
        </div>
      )}
    </div>
  );
}

function inputStyle(accentColor) {
  return {
    height: '44px', padding: '0 14px', border: '1.5px solid #e2e8f0',
    borderRadius: '10px', background: '#fff', color: '#0f172a',
    fontSize: '14px', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
  };
}

export default function Landing() {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [openFaq,     setOpenFaq]     = useState(null);
  const [payModal,    setPayModal]    = useState(null); // null | 'pro' | 'business'

  // Theme init + Google Fonts + counter animation
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && sysDark)) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else if (saved === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }

    if (!document.getElementById('landing-fonts')) {
      const link = document.createElement('link');
      link.id = 'landing-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap';
      document.head.appendChild(link);
    }

    function animateCount(el, target, duration) {
      const start = performance.now();
      function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * ease);
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    const counterObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          if (!isNaN(target)) { animateCount(el, target, 1400); counterObs.unobserve(el); }
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-count]').forEach(el => counterObs.observe(el));
    return () => counterObs.disconnect();
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (!e.target.closest('#mobileMenu') && !e.target.closest('#burgerBtn')) setMenuOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    document.documentElement.classList.toggle('light', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  function toggleFaq(id) {
    setOpenFaq(prev => (prev === id ? null : id));
  }

  return (
    <>
      {/* ── MODAL DE PAGO RÁPIDO ── */}
      {payModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Pagar Plan ${PLAN_LABELS[payModal]}`}
          onClick={(e) => { if (e.target === e.currentTarget) setPayModal(null); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div style={{
            background: '#fff', borderRadius: '16px',
            padding: '28px 28px 24px', width: '100%', maxWidth: '420px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Activar Plan {PLAN_LABELS[payModal]}
              </h2>
              <button
                onClick={() => setPayModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', lineHeight: 1 }}
                aria-label="Cerrar"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <QuickPayModal plan={payModal} onClose={() => setPayModal(null)} />
          </div>
        </div>
      )}

      {/* ── NAVBAR ── */}
      <nav id="nav" role="navigation" aria-label="Principal">
        <div className="nav-pill">
          <a href="#" className="nav-logo" aria-label="MastexoPOS inicio">
            <img src={logo} alt="MastexoPOS" style={{ height: '40px', width: 'auto', display: 'block', objectFit: 'contain' }} />
          </a>

          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Precios</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>

          <div className="nav-spacer" />

          <div className="nav-actions">
            <button id="theme-toggle" onClick={toggleTheme} aria-label="Cambiar tema" title="Cambiar tema claro/oscuro">
              <svg className="icon-sun" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <svg className="icon-moon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </button>
            <a href="/login" className="btn-nav-ghost">Iniciar sesión</a>
            <a href="/register" className="btn-nav-primary">Empezar gratis</a>
            <button className="nav-burger" id="burgerBtn" onClick={() => setMenuOpen(o => !o)} aria-label="Menú" aria-expanded={menuOpen}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className={`nav-mobile-menu${menuOpen ? ' open' : ''}`} id="mobileMenu" role="menu">
          <a href="#features" role="menuitem" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#pricing" role="menuitem" onClick={() => setMenuOpen(false)}>Precios</a>
          <a href="#faq" role="menuitem" onClick={() => setMenuOpen(false)}>FAQ</a>
          <hr className="nav-mobile-divider" />
          <a href="/login" role="menuitem" style={{ color: 'var(--subtle)' }} onClick={() => setMenuOpen(false)}>Iniciar sesión</a>
          <a href="/register" className="nav-mobile-cta" role="menuitem" onClick={() => setMenuOpen(false)}>Empezar gratis →</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="hero" aria-label="Encabezado principal">
        <div className="hero-glow" aria-hidden="true" />

        <div className="hero-grid container">
          <div className="hero-copy">
            <div className="hero-badge">
              <span className="live-dot" aria-hidden="true" />
              +200 restaurantes activos · Chile y LatAm
            </div>

            <h1 className="hero-h1">
              Tu restaurante,<br />
              <em>sin caos</em><br />
              desde el primer pedido
            </h1>

            <p className="hero-sub">
              Pedidos, mesas, ventas y stock en un solo sistema. Sin instalar nada, sin técnicos, sin sorpresas.
            </p>

            <div className="hero-ctas">
              <a href="/register" className="btn btn-green">
                Crear mi restaurante gratis
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a href="#features" className="btn btn-outline">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ver demo en 2 min
              </a>
            </div>

            <p className="hero-trust">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Sin tarjeta de crédito
              <span className="trust-dot" aria-hidden="true" />
              Cancela cuando quieras
              <span className="trust-dot" aria-hidden="true" />
              Setup en 5 minutos
            </p>
          </div>

          {/* Dashboard Mockup */}
          <div className="hero-mockup" aria-hidden="true">
            <div className="mockup-glow" />
            <div className="mockup-window">
              <div className="mockup-chrome">
                <div className="chrome-dots">
                  <div className="cd r" /><div className="cd y" /><div className="cd g" />
                </div>
                <div className="chrome-addr">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  app.mastexopos.com
                </div>
              </div>
              <div className="mockup-body">
                <div className="mock-sb">
                  <div className="mock-sb-logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  </div>
                  <div className="mock-sb-item active">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="mock-sb-item inactive">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="mock-sb-item inactive">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="mock-sb-item inactive">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <div className="mock-main">
                  <div className="mock-topbar">
                    <span className="mock-topbar-title">Dashboard</span>
                    <span className="mock-topbar-date">Hoy, 14:32</span>
                  </div>
                  <div className="mock-kpis">
                    <div className="mock-kpi">
                      <div className="mock-kpi-label">Ventas hoy</div>
                      <div className="mock-kpi-val">$847K</div>
                      <div className="mock-kpi-delta">↑ +12.4%</div>
                    </div>
                    <div className="mock-kpi">
                      <div className="mock-kpi-label">Pedidos activos</div>
                      <div className="mock-kpi-val">14</div>
                      <div className="mock-kpi-delta">8 en curso</div>
                    </div>
                    <div className="mock-kpi">
                      <div className="mock-kpi-label">Mesas ocupadas</div>
                      <div className="mock-kpi-val">6/9</div>
                      <div className="mock-kpi-delta">↑ 67% ocupación</div>
                    </div>
                  </div>
                  <div className="mock-row">
                    <div className="mock-card">
                      <div className="mock-card-hdr">
                        <span className="mock-card-ttl">Ventas esta semana</span>
                        <span className="mock-card-badge">+18%</span>
                      </div>
                      <div className="mock-bars">
                        <div className="mock-bar" style={{ height: '42%' }} />
                        <div className="mock-bar" style={{ height: '58%' }} />
                        <div className="mock-bar" style={{ height: '35%' }} />
                        <div className="mock-bar" style={{ height: '72%' }} />
                        <div className="mock-bar" style={{ height: '50%' }} />
                        <div className="mock-bar hi" style={{ height: '100%' }} />
                        <div className="mock-bar" style={{ height: '62%' }} />
                      </div>
                    </div>
                    <div className="mock-card mock-orders">
                      <div className="mock-card-hdr">
                        <span className="mock-card-ttl">Pedidos live</span>
                      </div>
                      <div className="mock-order-row">
                        <span className="mock-order-dot dot-open" />
                        <span className="mock-order-name">Mesa 3 · 4 items</span>
                        <span className="mock-order-status s-open">Abierto</span>
                      </div>
                      <div className="mock-order-row">
                        <span className="mock-order-dot dot-prep" />
                        <span className="mock-order-name">Mesa 7 · 2 items</span>
                        <span className="mock-order-status s-prep">Cocina</span>
                      </div>
                      <div className="mock-order-row">
                        <span className="mock-order-dot dot-open" />
                        <span className="mock-order-name">Mesa 1 · 6 items</span>
                        <span className="mock-order-status s-open">Abierto</span>
                      </div>
                      <div className="mock-order-row">
                        <span className="mock-order-dot dot-done" />
                        <span className="mock-order-name">Mesa 5 · 3 items</span>
                        <span className="mock-order-status s-done">Listo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section id="social" aria-label="Prueba social">
        <div className="social-top container">
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-num"><span className="g">+200</span></div>
              <div className="stat-label">Restaurantes activos</div>
            </div>
            <div className="stat-item">
              <div className="stat-num"><span className="g">98</span>%</div>
              <div className="stat-label">Tasa de retención</div>
            </div>
            <div className="stat-item">
              <div className="stat-num"><span className="g">4.9</span></div>
              <div className="stat-label">Calificación promedio</div>
            </div>
            <div className="stat-item">
              <div className="stat-num"><span className="g">5 min</span></div>
              <div className="stat-label">Setup promedio</div>
            </div>
          </div>

          <div className="testimonials">
            <article className="tcard">
              <div className="tcard-metric">Cierre de caja: 20 min → 2 min</div>
              {STARS}
              <p className="tcard-quote">Antes tardábamos 20 minutos en cuadrar caja al cierre. Con MastexoPOS lo hacemos en 2. El sistema te da todo en tiempo real, no hay espacio para errores.</p>
              <div className="tcard-author">
                <div className="tcard-avatar">CP</div>
                <div>
                  <div className="tcard-restaurant">Resto&amp;Bar Central</div>
                  <div className="tcard-name">Carlos Pereira · Dueño · Santiago</div>
                  <div className="tcard-verified">{VERIFIED_ICON} Cliente activo</div>
                </div>
              </div>
            </article>

            <article className="tcard">
              <div className="tcard-metric">Costo recuperado en 1 semana</div>
              {STARS}
              <p className="tcard-quote">El control de stock es lo que más nos cambió el negocio. Ya no compramos de más, los alertas por email llegan antes de quedarnos sin ingredientes. Recuperamos el costo en una semana.</p>
              <div className="tcard-author">
                <div className="tcard-avatar">VR</div>
                <div>
                  <div className="tcard-restaurant">Cocina 34</div>
                  <div className="tcard-name">Valentina Rojas · Gerente · Valparaíso</div>
                  <div className="tcard-verified">{VERIFIED_ICON} Cliente activo</div>
                </div>
              </div>
            </article>

            <article className="tcard">
              <div className="tcard-metric">Equipo listo en un turno</div>
              {STARS}
              <p className="tcard-quote">Probé tres sistemas antes. Este es el único que no necesita capacitación. Los meseros aprendieron en un turno y ahora no quieren volver al papel. Increíblemente intuitivo.</p>
              <div className="tcard-author">
                <div className="tcard-avatar">DM</div>
                <div>
                  <div className="tcard-restaurant">La Guagua Feliz</div>
                  <div className="tcard-name">Diego Morales · Chef-dueño · Concepción</div>
                  <div className="tcard-verified">{VERIFIED_ICON} Cliente activo</div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" aria-label="Funcionalidades">
        <div className="section-hdr container">
          <p className="section-eyebrow">Todo lo que necesitas</p>
          <h2 className="section-h2">Un sistema. Cada parte de tu<br />operación, <span className="g">bajo control</span></h2>
          <p className="section-p">Diseñado para restaurantes reales, no para corporaciones. Cada feature existe porque lo pidieron dueños de restaurantes como el tuyo.</p>
        </div>

        <div className="features-grid container">
          {[
            { n: '01', title: 'Pedidos en tiempo real', desc: 'Mesas activas, estado de cocina y notificaciones al instante. Sin retrasos, sin confusiones. Cada pedido llega donde tiene que llegar.' },
            { n: '02', title: 'Control de inventario', desc: 'El stock se descuenta automáticamente con cada pedido. Alertas por email antes de quedarte sin ingredientes. Nunca más sorpresas a media noche.' },
            { n: '03', title: 'Reservas con consumos', desc: 'Calendario de reservas integrado. Crea el pedido directo desde la reserva, registra consumos y cierra la cuenta sin fricciones.' },
            { n: '04', title: 'Ventas y tickets PDF', desc: 'Historial completo de ventas, tickets en PDF automáticos, exportación a Excel. Toda la información que necesitas para el SII y tu contador.' },
            { n: '05', title: 'Analytics avanzado', desc: 'Métricas por hora, por producto, comparativas semanales. Descubre cuál es tu plato más rentable y tu hora pico en segundos.' },
            { n: '06', title: 'Multi-usuario por roles', desc: 'Crea cuentas para admin, meseros, cocina y caja. Cada rol ve solo lo que necesita. Sin accesos indebidos, sin caos en pantalla.' },
          ].map(f => (
            <article key={f.n} className="fcard">
              <div className="fcard-num">{f.n}</div>
              <h3 className="fcard-title">{f.title}</h3>
              <p className="fcard-desc">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Mid-page CTA */}
      <div style={{ textAlign: 'center', padding: '0 24px 80px', position: 'relative', zIndex: 1 }}>
        <a href="/register" className="btn btn-green" style={{ fontSize: '16px', padding: '15px 32px' }}>
          Empezar gratis ahora — sin tarjeta
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" style={{ width: '18px', height: '18px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
        <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--subtle)' }}>Setup en 5 minutos · +200 restaurantes ya lo usan</p>
      </div>

      {/* ── PRICING ── */}
      <section id="pricing" aria-label="Planes y precios">
        <div className="section-hdr container">
          <p className="section-eyebrow">Precios</p>
          <h2 className="section-h2">Transparente desde el primer día.<br /><span className="g">Sin letra chica.</span></h2>
          <p className="section-p">Empieza gratis, sube cuando lo necesites. Sin contrato anual, sin costos de setup, sin sorpresas en tu tarjeta.</p>
        </div>

        <div className="pricing-cards container">
          {/* Starter */}
          <div className="pcard">
            <div className="pcard-name">Starter</div>
            <div className="pcard-headline">Tu restaurante online, sin costo.</div>
            <p className="pcard-desc">Gestiona pedidos y mesas desde el primer día. Sin técnicos, sin configuración, sin sorpresas.</p>
            <ul className="pcard-features">
              <li className="on">{CHECK_ICON} 50 pedidos por mes</li>
              <li className="on">{CHECK_ICON} Hasta 2 usuarios</li>
              <li className="on">{CHECK_ICON} 1 local</li>
              <li>{X_ICON} Tiempo real (WebSocket)</li>
              <li>{X_ICON} Analytics avanzado</li>
              <li>{X_ICON} Tickets PDF</li>
            </ul>
            <hr className="pcard-divider" />
            <div className="pcard-price-row">
              <div className="pcard-price">
                <span className="price-sym">$</span>
                <span className="price-amount">0</span>
              </div>
              <div className="price-period">Para siempre gratis · sin tarjeta</div>
            </div>
            <a href="/register" className="btn-pcard secondary">Empezar gratis</a>
          </div>

          {/* Pro (featured) */}
          <div className="pcard featured">
            <div className="pcard-badge">Más popular</div>
            <div className="pcard-name">Pro</div>
            <div className="pcard-headline">Operación sin límites, datos en tiempo real.</div>
            <p className="pcard-desc">Para restaurantes activos. Pedidos ilimitados, analytics completo y alertas automáticas de stock.</p>
            <ul className="pcard-features">
              <li className="on">{CHECK_ICON} Pedidos ilimitados</li>
              <li className="on">{CHECK_ICON} Usuarios ilimitados</li>
              <li className="on">{CHECK_ICON} Tiempo real (WebSocket)</li>
              <li className="on">{CHECK_ICON} Analytics avanzado</li>
              <li className="on">{CHECK_ICON} Tickets PDF + alertas email</li>
              <li>{X_ICON} Multi-local (hasta 5)</li>
            </ul>
            <hr className="pcard-divider" />
            <div className="pcard-price-row">
              <div className="pcard-price">
                <span className="price-sym">$</span>
                <span className="price-amount">29</span>
              </div>
              <div className="price-period">USD / mes · sin contrato</div>
            </div>
            <button
              className="btn-pcard primary"
              onClick={() => setPayModal('pro')}
              style={{ width: '100%', cursor: 'pointer' }}
            >
              Empezar con Pro
            </button>
            <p className="pcard-trust">✓ 14 días de prueba gratis · Cancela cuando quieras</p>
          </div>

          {/* Business */}
          <div className="pcard">
            <div className="pcard-name">Business</div>
            <div className="pcard-headline">Multi-local. Control total desde un panel.</div>
            <p className="pcard-desc">Para cadenas y grupos gastronómicos que operan múltiples locales con un solo sistema.</p>
            <ul className="pcard-features">
              <li className="on">{CHECK_ICON} Todo lo de Pro</li>
              <li className="on">{CHECK_ICON} Hasta 5 locales</li>
              <li className="on">{CHECK_ICON} API Keys para integraciones</li>
              <li className="on">{CHECK_ICON} Soporte prioritario</li>
              <li className="on">{CHECK_ICON} Reportes consolidados</li>
              <li className="on">{CHECK_ICON} Onboarding personalizado</li>
            </ul>
            <hr className="pcard-divider" />
            <div className="pcard-price-row">
              <div className="pcard-price">
                <span className="price-sym">$</span>
                <span className="price-amount">79</span>
              </div>
              <div className="price-period">USD / mes · sin contrato</div>
            </div>
            <button
              className="btn-pcard secondary"
              onClick={() => setPayModal('business')}
              style={{ width: '100%', cursor: 'pointer' }}
            >
              Activar Plan Business
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" aria-label="Preguntas frecuentes">
        <div className="section-hdr container">
          <p className="section-eyebrow">FAQ</p>
          <h2 className="section-h2">Preguntas frecuentes</h2>
          <p className="section-p">Todo lo que necesitas saber antes de empezar.</p>
        </div>

        <div className="faq-wrap container">
          {[
            {
              id: 'faq1',
              q: '¿Necesito instalar algún software?',
              a: 'No. MastexoPOS funciona 100% en el navegador. No hay que instalar nada, actualizar versiones ni gestionar servidores. Accedes desde cualquier dispositivo — computador, tablet o celular — con tu email y contraseña. Siempre actualizado automáticamente.',
            },
            {
              id: 'faq2',
              q: '¿Puedo empezar gratis sin ingresar mi tarjeta?',
              a: 'Sí. El plan Starter es gratis para siempre y no requiere tarjeta de crédito. Puedes crear tu restaurante, invitar a tu equipo y empezar a tomar pedidos en menos de 5 minutos. Cuando estés listo para más, el upgrade a Pro es con un clic.',
            },
            {
              id: 'faq3',
              q: '¿Qué incluye exactamente el plan Pro?',
              a: 'Pro incluye pedidos y usuarios ilimitados, tiempo real vía WebSocket (los pedidos llegan a cocina al instante), analytics avanzado con métricas por producto y hora, tickets en PDF automáticos para el cliente, y alertas de stock por email cuando el inventario baja del mínimo que tú configures.',
            },
            {
              id: 'faq4',
              q: '¿Puedo cancelar en cualquier momento?',
              a: 'Sí, sin preguntas ni trámites. Puedes cancelar desde tu panel de facturación con un clic. No hay contratos anuales ni penalizaciones. Al cancelar, tu cuenta pasa automáticamente al plan Starter y conservas todos tus datos.',
            },
            {
              id: 'faq5',
              q: '¿Tienen soporte técnico en español?',
              a: 'Sí. Nuestro equipo de soporte responde en español por chat y email, generalmente en menos de 2 horas en días hábiles. Los clientes Business tienen soporte prioritario con tiempo de respuesta garantizado. También tenemos documentación completa y tutoriales en video.',
            },
          ].map(({ id, q, a }) => (
            <div key={id} className={`faq-item${openFaq === id ? ' open' : ''}`}>
              <button className="faq-btn" onClick={() => toggleFaq(id)} aria-expanded={openFaq === id}>
                <span className="faq-q">{q}</span>
                <span className="faq-ico" aria-hidden="true">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </button>
              <div className="faq-ans">
                <div className="faq-ans-inner">{a}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section id="footer-cta" aria-label="Llamada a la acción final">
        <div className="fcta-box container">
          <p className="section-eyebrow" style={{ justifyContent: 'center' }}>Empieza hoy</p>
          <h2 className="section-h2">Tu restaurante merece un sistema<br /><span className="g">que trabaje tan duro como tú</span></h2>
          <p className="section-p">Únete a más de 200 restaurantes que ya operan con MastexoPOS. Empieza gratis en 5 minutos.</p>
          <div className="fcta-btns">
            <a href="/register" className="btn btn-green">
              Empezar gratis ahora
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a href="/login" className="btn btn-outline">Iniciar sesión</a>
          </div>
          <p className="fcta-note">Sin tarjeta de crédito · Sin contratos · Cancela cuando quieras</p>
        </div>
      </section>

      {/* ── FOOTER BAR ── */}
      <footer className="footer-bar" role="contentinfo">
        <a href="/" className="footer-logo"><span className="g">Mastexo</span>POS</a>
        <ul className="footer-links">
          <li><a href="#features">Funciones</a></li>
          <li><a href="#pricing">Precios</a></li>
          <li><a href="#faq">FAQ</a></li>
          <li><a href="/login">Iniciar sesión</a></li>
          <li><a href="/register">Registro</a></li>
          <li><a href="mailto:hola@mastexopos.com">Contacto</a></li>
          <li><a href="/privacidad">Privacidad</a></li>
          <li><a href="/terminos">Términos</a></li>
        </ul>
        <p className="footer-copy">© 2026 MastexoPOS · Todos los derechos reservados</p>
      </footer>
    </>
  );
}
