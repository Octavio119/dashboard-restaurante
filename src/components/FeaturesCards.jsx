const ICON_PATHS = {
  bolt:     'M13 10V3L4 14h7v7l9-11h-7z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  receipt:  'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
  bell:     'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  users:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  chart:    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
};

const FEATURES = [
  { key: 'bolt',     title: 'Pedidos en tiempo real',    desc: 'Comandas al instante. WebSocket nativo, sin recargar la página.' },
  { key: 'calendar', title: 'Mesas y reservas',          desc: 'Vista de sala con estado por mesa y reservas con consumos inline.' },
  { key: 'receipt',  title: 'Tickets en PDF',            desc: 'Cierra cuentas rápido y entrega ticket PDF al instante.' },
  { key: 'bell',     title: 'Alertas de stock',          desc: 'Email automático cuando el inventario cae del mínimo configurado.' },
  { key: 'users',    title: 'CRM de clientes',           desc: 'Historial de visitas y consumo. Conoce a tus mejores mesas.' },
  { key: 'chart',    title: 'Analytics por hora',        desc: 'Horas pico, platos estrella y días más rentables en una vista.' },
];

export default function FeaturesCards({ className = '' }) {
  return (
    <section id="features" className={`py-24 px-4 sm:px-6 bg-white ${className}`}>
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Todo lo que tu restaurante necesita
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Un sistema completo, sin módulos de pago, sin configuraciones complejas.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.key}
              className="group flex items-start gap-4 rounded-2xl border border-gray-200/70
                         bg-white/60 backdrop-blur-sm p-5 shadow-sm
                         transition-all duration-200
                         hover:-translate-y-1 hover:shadow-md hover:border-[#1D9E75]/30 hover:bg-white"
            >
              <div className="w-10 h-10 shrink-0 rounded-xl bg-[#1D9E75]/10 border border-[#1D9E75]/15
                              flex items-center justify-center
                              group-hover:bg-[#1D9E75]/20 transition-colors">
                <svg className="w-5 h-5 text-[#1D9E75]" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[f.key]} />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
