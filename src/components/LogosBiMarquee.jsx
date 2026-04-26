const FILA_1 = [
  'La Piola', 'Osaka Nikkei', 'Boragó', 'El Galope', 'Chipe Libre', 'Peumayen', 'Fuente Alemana',
];
const FILA_2 = [
  'Azul Profundo', 'La Mar', 'Mestizo', 'Quinoa', 'El Hoyo', 'Puerto Madero', 'Tierra Noble',
];

function Row({ names, reverse = false, speed = 22 }) {
  const anim = reverse ? 'bi-rev' : 'bi-fwd';
  return (
    <div className="overflow-hidden">
      <div className={`flex gap-3 whitespace-nowrap ${anim}`}
           style={{ animationDuration: `${speed}s` }}>
        {[...names, ...names, ...names].map((n, i) => (
          <span
            key={i}
            className="inline-block text-sm font-semibold text-gray-400
                       border border-gray-200 bg-white rounded-full px-4 py-1.5
                       hover:text-[#1D9E75] hover:border-[#1D9E75]/40 transition-colors
                       cursor-default select-none"
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function LogosBiMarquee({ className = '' }) {
  return (
    <div className={`py-10 border-y border-gray-100 bg-gray-50 overflow-hidden ${className}`}>
      <style>{`
        @keyframes bi-fwd { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }
        @keyframes bi-rev { from { transform: translateX(-33.333%); } to { transform: translateX(0); } }
        .bi-fwd { animation: bi-fwd linear infinite; }
        .bi-rev { animation: bi-rev linear infinite; }
        .bi-fwd:hover, .bi-rev:hover { animation-play-state: paused; }
      `}</style>

      <p className="text-center text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-6">
        Restaurantes que confían en MastexoPOS
      </p>

      <div className="space-y-2.5">
        <Row names={FILA_1} speed={26} />
        <Row names={FILA_2} speed={20} reverse />
      </div>

      <div className="flex justify-center gap-8 mt-8">
        {[['1.200+', 'restaurantes activos'], ['98%', 'satisfacción'], ['4.9 ★', 'calificación']].map(([v, l]) => (
          <div key={l} className="text-center">
            <p className="text-xl font-extrabold text-gray-900">{v}</p>
            <p className="text-xs text-gray-400">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
