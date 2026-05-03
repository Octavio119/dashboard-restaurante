/**
 * audit.js — Registro de acciones críticas en AuditLog.
 *
 * Uso en rutas:
 *   await audit(req, 'DELETE_PEDIDO', 'Pedido', pedidoId, { cliente_nombre: p.cliente_nombre });
 */

async function audit(req, accion, entidad, entidadId = null, detalle = null) {
  try {
    await req.prisma.auditLog.create({
      data: {
        restaurante_id: req.user?.restaurante_id ?? 0,
        usuario_id:     req.user?.id ?? null,
        accion,
        entidad,
        entidad_id:     entidadId ? String(entidadId) : null,
        detalle:        detalle ?? undefined,
        ip:             req.ip ?? req.headers['x-forwarded-for'] ?? null,
      },
    });
  } catch {
    // Audit failures must never crash the main request
  }
}

module.exports = { audit };
