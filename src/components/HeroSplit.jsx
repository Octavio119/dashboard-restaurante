import { useState, useEffect, useRef } from 'react';

const PLAY_PATH = 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z';

function useCounter(target, duration = 1600, active = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      setValue(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return value;
}

const METRICS = [
  { label: 'Órdenes hoy',   target: 847,  fmt: (n) => n.toLocaleString('es-CL'), delta: '+12%' },
  { label: 'Ventas del mes',target: 2400, fmt: (n) => `$${(n / 100).toFixed(1)}M`, delta: '+23%' },
  { label: 'Mesas activas', target: 23,   fmt: (n) => `${n}/30`,                  delta: '76%' },
];

function StatPill({ label, target, fmt, delta, active }) {
  const v = useCounter(target, 1600, active);
  return (
    <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-3 text-left">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-0.5">{label}</p>
      <p className="text-xl font-extrabold text-white leading-none">{fmt(v)}</p>
      <p className="text-xs text-[#1D9E75] mt-0.5 font-semibold">{delta}</p>
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="bg-gray-900 text-white">
      {/* Browser chrome */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2.5 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-yellow-400" />
        <span className="w-3 h-3 rounded-full bg-[#1D9E75]" />
        <span className="ml-2 flex-1 bg-gray-700 rounded px-2 py-0.5 text-xs text-gray-400 max-w-[200px]">
          app.mastexopos.com
        </span>
      </div>

      <div className="p-5">
        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {[
            ['$128.400', 'Ventas hoy',  'text-[#1D9E75]'],
            ['47',       'Órdenes',     'text-blue-400'],
            ['$2.732',   'Ticket prom.','text-yellow-400'],
          ].map(([v, l, c]) => (
            <div key={l} className="bg-gray-800 rounded-xl p-3">
              <p className={`text-base font-bold ${c}`}>{v}</p>
              <p className="text-xs text-gray-400 mt-0.5">{l}</p>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="bg-gray-800 rounded-xl p-3 mb-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Ventas últimos 7 días</p>
          <div className="flex items-end gap-1 h-14">
            {[40, 65, 52, 80, 72, 90, 68].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{ height: `${h}%`, background: i === 5 ? '#1D9E75' : '#1D9E7540' }}
              />
            ))}
          </div>
        </div>

        {/* Orders list */}
        <div className="space-y-1.5">
          {[
            ['Mesa 4', 'Ribeye + Malbec',    '$28.500', 'Listo',     'bg-green-900/60 text-[#1D9E75]'],
            ['Mesa 7', '2× Pasta Carbonara', '$19.800', 'En cocina', 'bg-yellow-900/60 text-yellow-400'],
            ['Mesa 2', 'Salmón + Agua',      '$16.200', 'Tomado',    'bg-blue-900/60 text-blue-400'],
          ].map(([m, p, v, s, sc]) => (
            <div key={m} className="bg-gray-800 rounded-lg px-3 py-2 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold">{m}</span>
                <span className="text-xs text-gray-400 ml-2">{p}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-300">{v}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sc}`}>{s}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HeroSplit({ onDemoOpen }) {
  const [animate, setAnimate] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setAnimate(true); },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden pt-24 pb-16 px-4 sm:px-6
                 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"
    >
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[500px]
                      bg-[#1D9E75]/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">

        {/* ── LEFT: copy ── */}
        <div>
          <span className="inline-block text-xs font-bold text-[#1D9E75] bg-[#1D9E75]/10
                           border border-[#1D9E75]/30 px-3 py-1 rounded-full mb-5 tracking-wide">
            Nuevo · Gratis para empezar
          </span>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
            Tu restaurante,{' '}
            <span className="text-[#1D9E75]">bajo control total</span>
          </h1>

          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            Pedidos, mesas, reservas, inventario y analytics — todo en un solo
            dashboard. Sin instalar nada.
          </p>

          {/* Animated counters */}
          <div className="flex gap-3 mb-8">
            {METRICS.map((m) => (
              <StatPill key={m.label} {...m} active={animate} />
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <a
              href="/register"
              className="px-6 py-3.5 rounded-xl bg-[#1D9E75] hover:bg-[#178a64] text-white
                         font-semibold text-center transition shadow-lg shadow-[#1D9E75]/25"
            >
              Empezar gratis
            </a>
            <button
              onClick={onDemoOpen}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                         border border-gray-600 text-gray-300 font-semibold
                         hover:border-[#1D9E75] hover:text-[#1D9E75] transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={PLAY_PATH} />
              </svg>
              Ver demo en 2 min
            </button>
          </div>

          <p className="text-xs text-gray-600">
            Sin tarjeta de crédito · 127 restaurantes activos · Cancela cuando quieras
          </p>
        </div>

        {/* ── RIGHT: browser frame ── */}
        <div className="relative lg:mt-0">
          {/* Soft glow behind */}
          <div className="absolute -inset-4 bg-[#1D9E75]/10 blur-3xl rounded-3xl" />

          <div className="relative rounded-2xl overflow-hidden border border-gray-700/60
                          shadow-[0_30px_80px_-15px_rgba(0,0,0,0.6)]">
            <DashboardMock />
          </div>

          {/* Floating badge */}
          <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2.5">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-xs font-bold text-gray-900">Tiempo real</p>
              <p className="text-xs text-gray-500">WebSocket nativo</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
