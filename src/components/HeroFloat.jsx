export default function HeroFloat({ onDemoOpen }) {
  return (
    <section className="relative overflow-hidden pt-28 pb-8 px-4 sm:px-6 bg-white">
      <style>{`
        @keyframes hero-float {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50%       { transform: translateY(-14px) rotate(-1deg); }
        }
        .hero-float { animation: hero-float 5s ease-in-out infinite; }
      `}</style>

      {/* Radial gradient bg */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(29,158,117,0.08),transparent)] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center">

        <span className="inline-block text-xs font-bold text-[#1D9E75] bg-[#1D9E75]/10
                         border border-[#1D9E75]/20 px-3 py-1 rounded-full mb-5 tracking-wide">
          Nuevo · Gratis para empezar
        </span>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-5">
          Tu restaurante,{' '}
          <span className="text-[#1D9E75]">bajo control total</span>
        </h1>

        <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
          Pedidos, mesas, reservas e inventario — en tiempo real, desde cualquier dispositivo.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <a
            href="/register"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#1D9E75] hover:bg-[#178a64]
                       text-white font-semibold text-center transition shadow-lg shadow-[#1D9E75]/25"
          >
            Empezar gratis
          </a>
          {onDemoOpen && (
            <button
              onClick={onDemoOpen}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-gray-200
                         text-gray-700 font-semibold hover:border-[#1D9E75] hover:text-[#1D9E75] transition"
            >
              Ver demo →
            </button>
          )}
        </div>

        {/* Floating dashboard */}
        <div className="hero-float inline-block w-full max-w-3xl">
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white
                          shadow-[0_40px_100px_-20px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)]">
            {/* Browser bar */}
            <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-[#1D9E75]" />
              <span className="ml-2 flex-1 bg-white rounded px-2 py-0.5 text-xs text-gray-400
                               border border-gray-200 max-w-[220px] text-left">
                app.mastexopos.com/dashboard
              </span>
            </div>
            {/* Dashboard content */}
            <div className="bg-gray-900 p-5">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  ['$128.400', 'Ventas hoy',   '#1D9E75'],
                  ['47',       'Órdenes',       '#60a5fa'],
                  ['$2.732',   'Ticket prom.',  '#fbbf24'],
                ].map(([v, l, c]) => (
                  <div key={l} className="bg-gray-800 rounded-xl p-3.5">
                    <p className="text-lg font-bold" style={{ color: c }}>{v}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-800 rounded-xl p-3.5 mb-3">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                  Ventas últimos 7 días
                </p>
                <div className="flex items-end gap-1 h-16">
                  {[38, 62, 50, 78, 70, 90, 65].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm transition-all"
                      style={{ height: `${h}%`, background: i === 5 ? '#1D9E75' : '#1D9E7530' }}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Mesa 4',  'Ribeye + Vino',  '$28.500', 'Listo'],
                  ['Mesa 7',  '2× Pasta',       '$19.800', 'En cocina'],
                ].map(([m, p, v, s]) => (
                  <div key={m} className="bg-gray-800 rounded-lg px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">{m}</p>
                      <p className="text-xs text-gray-400">{p}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-300">{v}</p>
                      <span className={`text-[10px] ${s === 'Listo' ? 'text-[#1D9E75]' : 'text-yellow-400'}`}>{s}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Ground shadow */}
          <div className="mx-auto mt-2 h-3 w-2/3 bg-black/8 blur-xl rounded-full" />
        </div>

      </div>
    </section>
  );
}
