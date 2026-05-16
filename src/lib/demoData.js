/**
 * Demo data for MastexoPOS — shown when the restaurant has no activity yet.
 * Simulates a busy Friday dinner service.
 */

export const DEMO_PEDIDOS = [
  { id: 'demo-1', cliente_nombre: 'Mesa 3 · Familia', estado: 'en_preparacion', total: 84600, item: 'Lomo saltado x2 · Pisco Sour x2', mesa: '3' },
  { id: 'demo-2', cliente_nombre: 'Mesa 7 · Pareja',  estado: 'pendiente',      total: 42800, item: 'Ceviche clásico · Chardonnay',    mesa: '7' },
  { id: 'demo-3', cliente_nombre: 'Mesa 1 · Grupo',   estado: 'pagado',         total: 178500, item: 'Parrilla completa x4 · Cerveza x6', mesa: '1' },
  { id: 'demo-4', cliente_nombre: 'Mesa 5 · Solo',    estado: 'en_preparacion', total: 28900, item: 'Salmón a la plancha · Agua',       mesa: '5' },
  { id: 'demo-5', cliente_nombre: 'Mesa 2 · Reunión', estado: 'pendiente',      total: 95600, item: 'Menú ejecutivo x3 · Café',         mesa: '2' },
  { id: 'demo-6', cliente_nombre: 'Mesa 9 · Aniversario', estado: 'completado', total: 156200, item: 'Degustación premium · Espumante',  mesa: '9' },
  { id: 'demo-7', cliente_nombre: 'Mesa 4 · Cumpleaños',  estado: 'completado', total: 98900, item: 'Asado completo · Carmenère x2',   mesa: '4' },
  { id: 'demo-8', cliente_nombre: 'Mesa 11 · Walk-in', estado: 'pendiente',     total: 31400, item: 'Pasta al pesto · Jugo natural',   mesa: '11' },
]

export const DEMO_VENTAS_RESUMEN = {
  total: 1287400,
  cantidad: 34,
  por_metodo: { efectivo: 445000, tarjeta: 680000, transferencia: 162400 },
}

export const DEMO_RESERVAS = [
  { id: 'r1', cliente_nombre: 'Familia González', fecha: new Date().toISOString().split('T')[0], personas: 4, estado: 'confirmado' },
  { id: 'r2', cliente_nombre: 'Ana Martínez + 1', fecha: new Date().toISOString().split('T')[0], personas: 2, estado: 'confirmado' },
  { id: 'r3', cliente_nombre: 'Tech Corp S.A.',   fecha: new Date().toISOString().split('T')[0], personas: 8, estado: 'pendiente'  },
  { id: 'r4', cliente_nombre: 'Dr. Rodríguez',   fecha: new Date().toISOString().split('T')[0], personas: 2, estado: 'confirmado' },
]

export const DEMO_SALES_DATA = [
  { day: 'Lun', sales: 345000 },
  { day: 'Mar', sales: 478000 },
  { day: 'Mié', sales: 412000 },
  { day: 'Jue', sales: 523000 },
  { day: 'Vie', sales: 687000 },
  { day: 'Sáb', sales: 892000 },
  { day: 'Dom', sales: 1287400 },
]
