import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, Tag, LayoutGrid, ShoppingBag, Receipt, Package,
  ChevronDown, CheckCircle2, Circle,
} from 'lucide-react';

const STEPS = [
  {
    key: 'menu',
    icon: Tag,
    color: '#8B5CF6',
    title: 'Configura tu menú',
    subtitle: 'Configuración → Menú',
    desc: 'Agrega las categorías de tus platos (ej: Entradas, Platos principales, Bebidas) y luego crea los productos con nombre, precio y foto. Todo lo que registres aquí estará disponible al tomar pedidos.',
    pasos: [
      'Ve a Configuración en el sidebar y haz clic en la pestaña "Menú".',
      'En "Categorías del menú", escribe el nombre de tu primera categoría (ej: Platos principales) y haz clic en + Agregar.',
      'En "Agregar producto al menú", completa nombre, categoría y precio, luego haz clic en + Agregar producto.',
    ],
  },
  {
    key: 'mesas',
    icon: LayoutGrid,
    color: '#3B82F6',
    title: 'Configura tus mesas',
    subtitle: 'Configuración → Negocio',
    desc: 'Completa los datos de tu negocio: nombre del restaurante, dirección, zona horaria y métodos de pago. Esta información aparece en los tickets y reportes.',
    pasos: [
      'Ve a Configuración → pestaña "Negocio".',
      'Completa nombre del restaurante, RUT, dirección y teléfono.',
      'Activa los métodos de pago que aceptas (Efectivo, Tarjeta, Transferencia, QR).',
      'Haz clic en "Guardar cambios".',
    ],
  },
  {
    key: 'pedido',
    icon: ShoppingBag,
    color: '#10B981',
    title: 'Toma tu primer pedido',
    subtitle: 'Pedidos → Nuevo pedido',
    desc: 'Crea un pedido asignando una mesa y seleccionando productos del menú. El pedido llega automáticamente a la cocina en tiempo real sin recargar pantalla.',
    pasos: [
      'Ve a la sección "Pedidos" en el sidebar.',
      'Haz clic en "+ Nuevo pedido" en la esquina superior derecha.',
      'Selecciona la mesa, escribe el nombre del cliente (opcional) y agrega los productos con sus cantidades.',
      'Haz clic en "Confirmar pedido" — el estado cambia a "En cocina" al instante.',
    ],
  },
  {
    key: 'venta',
    icon: Receipt,
    color: '#F59E0B',
    title: 'Registra una venta',
    subtitle: 'Ventas → Abrir caja',
    desc: 'Antes de registrar ventas debes abrir la caja del día con el monto inicial en efectivo. Luego puedes cobrar pedidos existentes o registrar ventas manuales.',
    pasos: [
      'Ve a "Ventas" y haz clic en "Abrir caja" — ingresa el monto inicial en efectivo.',
      'Para cobrar un pedido: ve a Pedidos, abre el detalle y haz clic en "Cobrar" — se crea la venta automáticamente.',
      'Para una venta directa: en Ventas haz clic en "+ Nueva venta", agrega los productos y confirma.',
      'Al final del día usa "Cerrar caja" para ver el resumen del turno.',
    ],
  },
  {
    key: 'inventario',
    icon: Package,
    color: '#EC4899',
    title: 'Gestiona tu inventario',
    subtitle: 'Inventario → Stock y Movimientos',
    desc: 'Lleva el control del stock de tus ingredientes y productos. Registra entradas y salidas, y recibe alertas por email cuando el stock baja del mínimo que configures.',
    pasos: [
      'Ve a "Inventario" en el sidebar.',
      'En la pestaña "Stock" verás todos los productos con su nivel actual.',
      'Haz clic en "+ Registrar movimiento" para agregar stock (entrada) o descontarlo (salida).',
      'Configura el stock mínimo en cada producto para recibir alertas automáticas por email.',
    ],
  },
];

const STORAGE_KEY = 'mastexopos_ayuda_completados';

function loadCompleted() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

export default function AyudaPage() {
  const [openStep, setOpenStep]   = useState('menu');
  const [completed, setCompleted] = useState(loadCompleted);

  const toggleCompleted = (key) => {
    setCompleted(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const totalDone = STEPS.filter(s => completed[s.key]).length;

  return (
    <motion.div
      key="ayuda"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 sm:p-8 flex flex-col gap-6 max-w-[860px] w-full mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 mb-1">
          <span
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(139,92,246,.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,.2)' }}
          >
            <HelpCircle size={9} className="inline" /> Ayuda
          </span>
        </div>
        <h2 className="text-3xl font-black tracking-tight">
          Primeros pasos <span style={{ color: '#8B5CF6' }}>con MastexoPOS</span>
        </h2>
        <p className="text-[15px]" style={{ color: '#9090B0' }}>
          Sigue estos 5 pasos para tener tu restaurante operativo en menos de 10 minutos.
        </p>

        {/* Progress */}
        <div className="flex items-center gap-3 mt-1">
          <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${(totalDone / STEPS.length) * 100}%`,
                background: 'linear-gradient(90deg, #7C3AED, #10B981)',
              }}
            />
          </div>
          <span className="text-[13px] font-bold tabular-nums shrink-0" style={{ color: '#9090B0' }}>
            {totalDone} / {STEPS.length} completados
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-3">
        {STEPS.map((step, idx) => {
          const isOpen = openStep === step.key;
          const isDone = !!completed[step.key];
          const Icon   = step.icon;

          return (
            <motion.div
              key={step.key}
              layout
              className="rounded-xl overflow-hidden"
              style={{
                background: isDone ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${
                  isDone ? 'rgba(16,185,129,0.18)' :
                  isOpen ? 'rgba(139,92,246,0.28)' :
                  'rgba(255,255,255,0.07)'
                }`,
                transition: 'border-color 200ms ease',
              }}
            >
              {/* Header row */}
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer transition-colors"
                style={{ background: isOpen && !isDone ? 'rgba(139,92,246,0.04)' : 'transparent' }}
                onClick={() => setOpenStep(isOpen ? null : step.key)}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: isDone ? 'rgba(16,185,129,0.12)' : `${step.color}18`,
                    border: `1px solid ${isDone ? 'rgba(16,185,129,0.25)' : `${step.color}30`}`,
                  }}
                >
                  {isDone
                    ? <CheckCircle2 size={18} style={{ color: '#10B981' }} />
                    : <Icon size={18} style={{ color: step.color }} />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#50506A' }}>
                      Paso {idx + 1}
                    </span>
                    {isDone && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}
                      >
                        Completado
                      </span>
                    )}
                  </div>
                  <p
                    className="text-[15px] font-bold leading-tight mt-0.5"
                    style={{ color: isDone ? '#9090B0' : '#F0F0FF' }}
                  >
                    {step.title}
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: '#50506A' }}>{step.subtitle}</p>
                </div>

                <ChevronDown
                  size={16}
                  className="shrink-0 transition-transform duration-200"
                  style={{
                    color: '#50506A',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>

              {/* Expanded body */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="px-5 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <p className="text-[14px] leading-relaxed mt-4 mb-4" style={{ color: '#9090B0' }}>
                        {step.desc}
                      </p>

                      <ol className="flex flex-col gap-2.5 mb-5">
                        {step.pasos.map((s, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5"
                              style={{
                                background: `${step.color}18`,
                                color: step.color,
                                border: `1px solid ${step.color}30`,
                              }}
                            >
                              {i + 1}
                            </span>
                            <span className="text-[13px] leading-relaxed" style={{ color: '#C0C0D8' }}>
                              {s}
                            </span>
                          </li>
                        ))}
                      </ol>

                      <button
                        onClick={() => toggleCompleted(step.key)}
                        className="flex items-center gap-2 rounded-lg transition-all duration-150 active:scale-95 cursor-pointer"
                        style={{
                          height: '40px',
                          padding: '0 20px',
                          fontSize: '13px',
                          fontWeight: 600,
                          borderRadius: '8px',
                          background: isDone ? 'rgba(255,255,255,0.05)' : 'rgba(16,185,129,0.12)',
                          color: isDone ? '#6B6B88' : '#10B981',
                          border: `1px solid ${isDone ? 'rgba(255,255,255,0.08)' : 'rgba(16,185,129,0.25)'}`,
                        }}
                      >
                        {isDone
                          ? <><Circle size={14} /> Marcar como pendiente</>
                          : <><CheckCircle2 size={14} /> Marcar como completado</>
                        }
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Completion banner */}
      <AnimatePresence>
        {totalDone === STEPS.length && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="rounded-xl p-6 text-center"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}
          >
            <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color: '#10B981' }} />
            <h3 className="text-[18px] font-black mb-1" style={{ color: '#F0F0FF' }}>
              ¡Todo listo! Tu restaurante está operativo.
            </h3>
            <p className="text-[14px]" style={{ color: '#9090B0' }}>
              Si necesitas ayuda adicional escríbenos a{' '}
              <a href="mailto:infra@mastexo.com" style={{ color: '#8B5CF6' }}>
                infra@mastexo.com
              </a>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
