const { toDate } = require('./dateUtils');

/**
 * Genera ticket_id y crea la venta de forma atómica.
 * next_ticket_numero() es un INSERT ... ON CONFLICT DO UPDATE de una sola
 * declaración sobre TicketSecuencia(restaurante_id, fecha): Postgres serializa
 * esa fila automáticamente, así que dos cajas cobrando en paralelo nunca pueden
 * obtener el mismo número (sin retries ni locks explícitos en el lado de la app).
 * Errores (incluido P2002 por pedido_id) se propagan tal cual: los callers
 * (pedidos.js) ya manejan el P2002 de pedido_id como confirmación duplicada.
 */
async function createVentaConTicket(prisma, ventaData, cfg, fecha, rid) {
  const prefijo = cfg.prefijo_ticket || 'TKT';
  const dateStr = fecha.replace(/-/g, '');
  const fechaDate = toDate(fecha);
  const inicial = cfg.numero_inicial || 1;

  const ventaDataClean = { ...ventaData, fecha: fechaDate };
  delete ventaDataClean.items; // items ya no viven en Venta

  return prisma.$transaction(async (tx) => {
    const [{ next_ticket_numero: nextSeq }] = await tx.$queryRaw`
      SELECT next_ticket_numero(${rid}, ${dateStr}, ${inicial}) AS next_ticket_numero
    `;

    const ticket_id = `${prefijo}-${dateStr}-${String(nextSeq).padStart(6, '0')}`;

    return tx.venta.create({ data: { ...ventaDataClean, ticket_id } });
  });
}

module.exports = { createVentaConTicket };
