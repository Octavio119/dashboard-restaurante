import { motion } from 'framer-motion';

const ICON_PATHS = {
  bolt:     'M13 10V3L4 14h7v7l9-11h-7z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  receipt:  'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
  bell:     'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  users:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  chart:    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
};

const FEATURES = [
  {
    key: 'bolt',
    color: 'bg-yellow-50 text-yellow-500 group-hover:bg-yellow-100',
    title: 'Pedidos en tiempo real',
    desc: 'Comandas que llegan al instante a cocina sin recargar. WebSocket nativo para que nada se pierda.',
  },
  {
    key: 'calendar',
    color: 'bg-blue-50 text-blue-500 group-hover:bg-blue-100',
    title: 'Mesas y reservas',
    desc: 'Vista de plano de sala con estado por mesa. Reservas con calendario y consumos inline.',
  },
  {
    key: 'receipt',
    color: 'bg-[#1D9E75]/10 text-[#1D9E75] group-hover:bg-[#1D9E75]/20',
    title: 'Ventas con ticket PDF',
    desc: 'Cierra cuentas en segundos. Ticket descargable en PDF listo para entregar al cliente.',
  },
  {
    key: 'bell',
    color: 'bg-orange-50 text-orange-500 group-hover:bg-orange-100',
    title: 'Alertas de stock',
    desc: 'Alertas por email cuando el inventario baja del mínimo. Nunca más te quedas sin insumos.',
  },
  {
    key: 'users',
    color: 'bg-purple-50 text-purple-500 group-hover:bg-purple-100',
    title: 'CRM de clientes',
    desc: 'Historial de visitas y consumo por cliente. Identifica tus mejores mesas en segundos.',
  },
  {
    key: 'chart',
    color: 'bg-sky-50 text-sky-500 group-hover:bg-sky-100',
    title: 'Analytics por hora',
    desc: 'Descubre tus horas pico, platos más vendidos y días más rentables.',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const card = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

export default function FeaturesStagger({ className = '' }) {
  return (
    <section id="features" className={`py-24 px-4 sm:px-6 bg-white ${className}`}>
      <div className="max-w-6xl mx-auto">

        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: -16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Todo lo que tu restaurante necesita
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Un sistema completo, sin módulos de pago, sin configuraciones complejas.
          </p>
        </motion.div>

        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.key}
              variants={card}
              whileHover={{ y: -4, transition: { duration: 0.15 } }}
              className="group p-7 rounded-2xl border border-gray-100
                         hover:border-[#1D9E75]/30 hover:shadow-lg hover:shadow-[#1D9E75]/5
                         transition-shadow duration-200 cursor-default bg-white"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors ${f.color}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[f.key]} />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
