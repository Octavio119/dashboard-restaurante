const NAMES = [
  'La Piola', 'Osaka Nikkei', 'Boragó', 'El Galope', 'Chipe Libre',
  'Peumayen', 'Azul Profundo', 'La Mar', 'Mestizo', 'Quinoa',
];

export default function LogosMarquee({ className = '' }) {
  return (
    <div className={`py-9 border-y border-gray-100 overflow-hidden bg-white ${className}`}>
      <style>{`
        @keyframes mq-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .mq-track {
          animation: mq-scroll 30s linear infinite;
          display: flex;
          gap: 2.5rem;
          white-space: nowrap;
        }
        .mq-track:hover { animation-play-state: paused; }
      `}</style>

      <p className="text-center text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-5">
        Usado por restaurantes en toda Latinoamérica
      </p>

      <div className="overflow-hidden">
        <div className="mq-track">
          {[...NAMES, ...NAMES].map((name, i) => (
            <span
              key={i}
              className="text-base font-bold text-gray-200 hover:text-[#1D9E75]
                         transition-colors duration-200 cursor-default select-none tracking-tight"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
