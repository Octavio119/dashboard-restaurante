import { useState, useEffect, useRef } from 'react';

const useNavigate = () => (path) => { window.location.href = path; };

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ path, className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const ICONS = {
  menu:      'M4 6h16M4 12h16M4 18h16',
  close:     'M6 18L18 6M6 6l12 12',
  check:     'M5 13l4 4L19 7',
  bolt:      'M13 10V3L4 14h7v7l9-11h-7z',
  calendar:  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  receipt:   'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
  bell:      'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  users:     'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  chart:     'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  play:      'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  chevron:   'M19 9l-7 7-7-7',
  star:      'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
};

// ─── Video Modal ──────────────────────────────────────────────────────────────
function VideoModal({ open, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/80 transition"
        >
          <Icon path={ICONS.close} className="w-5 h-5" />
        </button>
        <div className="aspect-video bg-black">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
            title="Demo MastexoPOS"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ onDemoOpen }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-[#1D9E75]">Mastexo</span>
            <span className="text-gray-900">POS</span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
          <button onClick={() => scrollTo('features')} className="hover:text-[#1D9E75] transition">Features</button>
          <button onClick={() => scrollTo('precios')} className="hover:text-[#1D9E75] transition">Precios</button>
          <button onClick={() => scrollTo('faq')} className="hover:text-[#1D9E75] transition">FAQ</button>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition"
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-4 py-2 rounded-lg bg-[#1D9E75] text-white text-sm font-semibold hover:bg-[#178a64] transition shadow-sm"
          >
            Empezar gratis
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menú"
        >
          <Icon path={mobileOpen ? ICONS.close : ICONS.menu} className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-5 pt-3 space-y-3 shadow-lg">
          {['features', 'precios', 'faq'].map((id) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="block w-full text-left text-gray-700 font-medium py-2 capitalize hover:text-[#1D9E75] transition"
            >
              {id === 'precios' ? 'Precios' : id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          ))}
          <hr className="border-gray-100" />
          <button
            onClick={() => { setMobileOpen(false); navigate('/login'); }}
            className="block w-full text-center px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:border-[#1D9E75] transition"
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => { setMobileOpen(false); navigate('/register'); }}
            className="block w-full text-center px-4 py-2.5 rounded-lg bg-[#1D9E75] text-white font-semibold hover:bg-[#178a64] transition"
          >
            Empezar gratis
          </button>
        </div>
      )}
    </header>
  );
}

// ─── Animated Counter hook ────────────────────────────────────────────────────
function useCounter(target, duration = 1800, active = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const startTime = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return value;
}

// ─── Hero Metric Card ─────────────────────────────────────────────────────────
const HERO_METRICS = [
  {
    label: 'Órdenes hoy',
    target: 847,
    format: (n) => n.toLocaleString('es-CL'),
    delta: '+12% vs ayer',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    label: 'Ventas del mes',
    target: 24,
    format: (n) => `$${(n / 10).toFixed(1)}M`,
    delta: '+23% este mes',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    label: 'Mesas activas',
    target: 23,
    format: (n) => `${n}/30`,
    delta: '76% ocupación',
    icon: 'M3 10h18M3 14h18M10 6h4M10 18h4M5 6h.01M5 18h.01M19 6h.01M19 18h.01',
  },
];

function HeroMetricCard({ label, target, format, delta, icon, active }) {
  const value = useCounter(target, 1800, active);
  return (
    <div className="flex-1 bg-white border border-[#E2EDE9] rounded-2xl p-5 text-left shadow-sm hover:shadow-md hover:border-[#1D9E75]/30 transition-all duration-200">
      <div className="w-8 h-8 rounded-lg bg-[#1D9E75]/10 flex items-center justify-center mb-3">
        <Icon path={icon} className="w-4 h-4 text-[#1D9E75]" />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8AAAA0] mb-1">{label}</p>
      <p className="text-3xl font-extrabold text-gray-900 tracking-tight leading-none mb-2">
        {format(value)}
      </p>
      <p className="flex items-center gap-1 text-xs font-semibold text-[#1D9E75]">
        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        {delta}
      </p>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ onDemoOpen }) {
  const navigate = useNavigate();
  const [animate, setAnimate] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimate(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="pt-32 pb-20 px-4 sm:px-6 bg-gradient-to-b from-[#f0fdf8] to-white text-center">
      <div className="max-w-3xl mx-auto">
        {/* Badge */}
        <span className="inline-block mb-4 px-3 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] text-xs font-semibold tracking-wide uppercase">
          Nuevo · Gratis para empezar
        </span>

        {/* Headline — "primer" con underline verde */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-5">
          Gestiona tu restaurante<br />
          desde el{' '}
          <span className="relative inline-block text-[#1D9E75]">
            primer
            <span
              aria-hidden="true"
              className="absolute bottom-0.5 left-0 right-0 h-1 rounded-full bg-[#1D9E75]/70"
            />
          </span>
          {' '}día
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-gray-500 mb-8 max-w-xl mx-auto">
          Pedidos, mesas, ventas y stock en un solo sistema.&nbsp;
          <span className="font-medium text-gray-700">Sin instalar nada.</span>
        </p>

        {/* Metric cards con contadores animados */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 max-w-2xl mx-auto">
          {HERO_METRICS.map((m) => (
            <HeroMetricCard key={m.label} {...m} active={animate} />
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-3">
          <button
            onClick={() => navigate('/register')}
            className="px-7 py-3.5 rounded-xl bg-[#1D9E75] text-white font-semibold text-base hover:bg-[#178a64] transition shadow-md shadow-[#1D9E75]/30"
          >
            Empezar gratis
          </button>
          <button
            onClick={onDemoOpen}
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-base hover:border-[#1D9E75] hover:text-[#1D9E75] transition"
          >
            <Icon path={ICONS.play} className="w-5 h-5" />
            Ver demo en 2 minutos
          </button>
        </div>

        {/* Social proof */}
        <p className="text-xs text-gray-400 mb-14">
          127 restaurantes ya lo usan · Sin tarjeta de crédito · Cancela cuando quieras
        </p>

        {/* Dashboard mockup */}
        <div className="relative mx-auto max-w-4xl rounded-2xl overflow-hidden border border-gray-200 shadow-2xl">
          <div className="bg-gray-800 h-8 flex items-center gap-2 px-4">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="mx-auto text-xs text-gray-400">app.mastexopos.com/dashboard</span>
          </div>
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 aspect-[16/9] flex items-center justify-center">
            <div className="grid grid-cols-3 gap-4 p-8 w-full opacity-60">
              {['Pedidos activos', 'Ventas hoy', 'Mesas ocupadas', 'Stock crítico', 'Clientes', 'Tickets'].map((label, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-xs text-gray-400 mb-1">{label}</div>
                  <div className="text-2xl font-bold text-white">{['12', '$182k', '8/12', '3', '47', '24'][i]}</div>
                  <div className="mt-2 h-1.5 bg-[#1D9E75]/30 rounded-full">
                    <div className="h-full bg-[#1D9E75] rounded-full" style={{ width: `${[75, 60, 66, 25, 80, 55][i]}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Social Proof ─────────────────────────────────────────────────────────────
function SocialProof() {
  const testimonials = [
    { name: 'Restaurante Don Carlos', location: 'Santiago, Chile', quote: '"Antes anotábamos los pedidos en papel. Ahora todo está en pantalla y no perdemos ninguna orden."' },
    { name: 'La Terraza Bistró', location: 'Valparaíso, Chile', quote: '"El control de stock nos ahorró pérdidas que no sabíamos que teníamos."' },
    { name: 'Parrilla Los Robles', location: 'Concepción, Chile', quote: '"En 30 minutos ya teníamos el sistema corriendo. Increíblemente fácil."' },
  ];

  return (
    <section className="py-14 bg-gray-50 border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-10">
          Ya usado por restaurantes en Chile
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, j) => (
                  <Icon key={j} path={ICONS.star} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{t.quote}</p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-9 h-9 rounded-full bg-[#1D9E75]/15 flex items-center justify-center text-[#1D9E75] font-bold text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: ICONS.bolt,
    title: 'Pedidos en tiempo real',
    desc: 'Comandas que llegan al instante a cocina sin recargar. WebSocket nativo para que nada se pierda.',
  },
  {
    icon: ICONS.calendar,
    title: 'Mesas y reservas',
    desc: 'Vista de plano de sala con estado por mesa. Reservas con vista calendario y consumos inline.',
  },
  {
    icon: ICONS.receipt,
    title: 'Ventas con ticket PDF',
    desc: 'Cierra cuentas en segundos. Ticket descargable en PDF listo para entregar al cliente.',
  },
  {
    icon: ICONS.bell,
    title: 'Stock con alertas automáticas',
    desc: 'Alertas por email cuando el inventario baja del mínimo. Nunca más te quedas sin insumos.',
  },
  {
    icon: ICONS.users,
    title: 'CRM básico de clientes',
    desc: 'Historial de visitas y consumo por cliente. Identifica a tus mejores mesas en segundos.',
  },
  {
    icon: ICONS.chart,
    title: 'Analytics por hora',
    desc: 'Descubre tus horas pico, tus platos más vendidos y tus días más rentables.',
  },
];

function Features() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Todo lo que tu restaurante necesita
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Un sistema completo, sin módulos de pago, sin configuraciones complejas.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="group p-7 rounded-2xl border border-gray-100 hover:border-[#1D9E75]/40 hover:shadow-lg hover:shadow-[#1D9E75]/5 transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-[#1D9E75]/10 flex items-center justify-center mb-4 group-hover:bg-[#1D9E75]/20 transition">
                <Icon path={f.icon} className="w-5 h-5 text-[#1D9E75]" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Starter',
    price: '$0',
    period: '/mes',
    desc: 'Para empezar sin riesgo',
    highlight: false,
    features: [
      '50 órdenes por mes',
      '2 usuarios',
      'Pedidos y mesas',
      'Reservas básicas',
      'Soporte por email',
    ],
    cta: 'Empezar gratis',
    href: '/register',
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mes',
    desc: 'Para restaurantes en crecimiento',
    highlight: true,
    badge: 'Más popular',
    features: [
      'Órdenes ilimitadas',
      'Usuarios ilimitados',
      'Analytics avanzado',
      'WebSocket tiempo real',
      'Alertas de stock por email',
      'Tickets en PDF',
      'Soporte prioritario',
    ],
    cta: 'Empezar Pro',
    href: '/register?plan=pro',
  },
  {
    name: 'Business',
    price: '$79',
    period: '/mes',
    desc: 'Para cadenas y multi-local',
    highlight: false,
    features: [
      'Todo lo de Pro',
      'Hasta 5 locales',
      'Dashboard global multi-local',
      'API access (integrations)',
      'Soporte dedicado',
    ],
    cta: 'Empezar Business',
    href: '/register?plan=business',
  },
];

function Pricing() {
  const navigate = useNavigate();

  return (
    <section id="precios" className="py-24 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Precios simples, sin sorpresas
          </h2>
          <p className="text-gray-500 text-lg">Empieza gratis, escala cuando lo necesites.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-7 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl p-7 border transition-all ${
                plan.highlight
                  ? 'border-[#1D9E75] shadow-xl shadow-[#1D9E75]/15 bg-white'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#1D9E75] text-white text-xs font-bold tracking-wide shadow">
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <h3 className={`text-sm font-semibold uppercase tracking-widest mb-1 ${plan.highlight ? 'text-[#1D9E75]' : 'text-gray-400'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm mb-1.5">{plan.period}</span>
                </div>
                <p className="text-gray-500 text-sm">{plan.desc}</p>
              </div>

              <ul className="space-y-3 flex-1 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Icon path={ICONS.check} className="w-4 h-4 text-[#1D9E75] mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate(plan.href)}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition ${
                  plan.highlight
                    ? 'bg-[#1D9E75] text-white hover:bg-[#178a64] shadow-md shadow-[#1D9E75]/30'
                    : 'border border-gray-300 text-gray-700 hover:border-[#1D9E75] hover:text-[#1D9E75]'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Sin tarjeta de crédito para Starter &nbsp;·&nbsp; Cancela cuando quieras
        </p>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: '¿Necesito instalar algo?',
    a: 'No. MastexoPOS funciona completamente desde el navegador, en cualquier dispositivo. Solo necesitas internet.',
  },
  {
    q: '¿Puedo cambiar de plan?',
    a: 'Sí, en cualquier momento desde el panel de facturación de tu cuenta. El cambio es inmediato.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Sí. Usamos PostgreSQL con backups diarios en Railway. Cada restaurante tiene sus datos completamente aislados.',
  },
  {
    q: '¿Funciona en tablet y celular?',
    a: 'Sí, el diseño es responsive. Ideal para meseros con tablet o para revisar el estado desde tu celular.',
  },
  {
    q: '¿Hay contrato de permanencia?',
    a: 'No. Los planes son mes a mes. Puedes cancelar en cualquier momento sin penalidades.',
  },
];

function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Preguntas frecuentes
          </h2>
          <p className="text-gray-500">Lo que todos preguntan antes de empezar.</p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className={`rounded-xl border transition-all ${open === i ? 'border-[#1D9E75]/40 shadow-sm' : 'border-gray-200'}`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-semibold text-gray-800 text-sm sm:text-base">{item.q}</span>
                <Icon
                  path={ICONS.chevron}
                  className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180 text-[#1D9E75]' : ''}`}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer CTA ───────────────────────────────────────────────────────────────
function FooterCTA() {
  const navigate = useNavigate();
  return (
    <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-[#1D9E75] to-[#14876200]" style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0f7a5a 100%)' }}>
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          Empieza hoy, sin tarjeta de crédito
        </h2>
        <p className="text-white/70 text-lg mb-8">
          Configura tu restaurante en menos de 5 minutos.
        </p>
        <button
          onClick={() => navigate('/register')}
          className="px-8 py-4 rounded-xl bg-white text-[#1D9E75] font-extrabold text-base hover:bg-gray-50 transition shadow-xl"
        >
          Crear cuenta gratis
        </button>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <span className="font-bold text-base">
          <span className="text-[#1D9E75]">Mastexo</span>
          <span className="text-white">POS</span>
        </span>
        <div className="flex items-center gap-5">
          <a href="/terminos" className="hover:text-white transition">Términos</a>
          <a href="/privacidad" className="hover:text-white transition">Privacidad</a>
          <a href="mailto:hola@mastexopos.com" className="hover:text-white transition">Contacto</a>
        </div>
        <span className="text-xs text-gray-600">© {new Date().getFullYear()} MastexoPOS. Todos los derechos reservados.</span>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Landing() {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <div className="min-h-screen font-sans antialiased">
      <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} />
      <Navbar onDemoOpen={() => setVideoOpen(true)} />
      <main>
        <Hero onDemoOpen={() => setVideoOpen(true)} />
        <SocialProof />
        <Features />
        <Pricing />
        <FAQ />
        <FooterCTA />
      </main>
      <Footer />
    </div>
  );
}
