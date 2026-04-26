export default function HeroPerspective({ onDemoOpen }) {
  return (
    <section className="relative overflow-hidden pt-28 pb-4 px-4 sm:px-6 bg-gradient-to-b from-[#f0fdf8] to-white">
      {/* Soft glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px]
                      bg-[#1D9E75]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center">

        <span className="inline-block text-xs font-bold text-[#1D9E75] bg-[#1D9E75]/10
                         border border-[#1D9E75]/20 px-3 py-1 rounded-full mb-5 tracking-wide">
          Nuevo · Gratis para empezar
        </span>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-5">
          Gestiona tu restaurante{' '}
          <span className="relative inline-block text-[#1D9E75]">
            desde el primer día
            <span className="absolute bottom-0.5 left-0 right-0 h-1 rounded-full bg-[#1D9E75]/50" />
          </span>
        </h1>

        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8">
          Pedidos, mesas, reservas, stock y analytics — en un solo lugar.
          Sin instalar nada.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 mb-12">
          <a
            href="/register"
            className="px-7 py-3.5 rounded-xl bg-[#1D9E75] hover:bg-[#178a64]
                       text-white font-semibold transition shadow-lg shadow-[#1D9E75]/25"
          >
            Empezar gratis
          </a>
          {onDemoOpen && (
            <button
              onClick={onDemoOpen}
              className="px-7 py-3.5 rounded-xl border border-gray-300 text-gray-700
                         font-semibold hover:border-[#1D9E75] hover:text-[#1D9E75] transition"
            >
              Ver demo →
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 mb-14">
          127 restaurantes activos · Sin tarjeta de crédito
        </p>

        {/* 3D perspective screenshot */}
        <div style={{ perspective: '1400px' }}>
          <div
            className="rounded-2xl overflow-hidden border border-gray-200
                       shadow-[0_40px_100px_-20px_rgba(0,0,0,0.22),0_0_0_1px_rgba(0,0,0,0.04)]
                       transition-transform duration-700
                       hover:[transform:rotateX(0deg)_rotateY(0deg)]"
            style={{ transform: 'rotateX(7deg) rotateY(-1deg)', transformOrigin: 'center bottom' }}
          >
            {/* Browser chrome */}
            <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-[#1D9E75]" />
              <span className="ml-2 flex-1 bg-white rounded px-2 py-0.5 text-xs text-gray-400
                               border border-gray-200 max-w-[240px]">
                app.mastexopos.com/dashboard
              </span>
            </div>

            {/* Dashboard mock */}
            <div className="bg-gray-900 p-6 text-white">
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  ['$128.400', 'Ventas hoy',   '#1D9E75'],
                  ['47',       'Órdenes',       '#60a5fa'],
                  ['$2.732',   'Ticket prom.',  '#fbbf24'],
                  ['23/30',    'Mesas',         '#c084fc'],
                ].map(([v, l, c]) => (
                  <div key={l} className="bg-gray-800 rounded-xl p-3">
                    <p className="text-xl font-extrabold" style={{ color: c }}>{v}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{l}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Chart */}
                <div className="col-span-2 bg-gray-800 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">
                    Ventas últimos 7 días
                  </p>
                  <div className="flex items-end gap-1.5 h-20">
                    {[38, 62, 50, 78, 70, 90, 65].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded"
                        style={{ height: `${h}%`, background: i === 5 ? '#1D9E75' : '#1D9E7525' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Orders */}
                <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-2">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">Últimas órdenes</p>
                  {['Mesa 4 · Listo', 'Mesa 7 · Cocina', 'Mesa 2 · Tomado'].map((o, i) => (
                    <div key={i} className="text-xs text-gray-300 bg-gray-700/50 rounded px-2 py-1">{o}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
