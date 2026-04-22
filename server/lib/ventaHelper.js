/**
 * Genera ticket_id y crea la venta con reintentos automáticos ante colisión.
 * Necesario porque dos requests concurrentes pueden leer el mismo MAX antes
 * de que cualquiera inserte, produciendo el mismo ticket_id.
 */
async function createVentaConTicket(prisma, ventaData, cfg, fecha, rid, maxRetries = 8) {
  const prefijo = cfg.prefijo_ticket || 'TKT';
  const dateStr = fecha.replace(/-/g, '');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const last = await prisma.venta.findFirst({
      where:   { fecha, restaurante_id: rid },
      orderBy: { id: 'desc' },
      select:  { ticket_id: true },
    });

    let nextSeq = (cfg.numero_inicial || 1) + attempt;
    if (last?.ticket_id) {
      const m = last.ticket_id.match(/(\d+)$/);
      if (m) nextSeq = Math.max(nextSeq, parseInt(m[1]) + 1);
    }

    const ticket_id = `${prefijo}-${dateStr}-${String(nextSeq).padStart(6, '0')}`;

    try {
      return await prisma.venta.create({ data: { ...ventaData, ticket_id } });
    } catch (e) {
      // Retry on ANY unique constraint violation (ticket_id race condition).
      // Prisma v5 puts the constraint name in meta.target, not the field name,
      // so checking the code alone is the safest approach.
      if (e.code === 'P2002' && attempt < maxRetries - 1) {
        continue;
      }
      throw e;
    }
  }
  throw new Error('No se pudo generar un ticket_id único tras varios intentos');
}

module.exports = { createVentaConTicket };
