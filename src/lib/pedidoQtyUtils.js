/**
 * Actualiza la cantidad de un ítem en la lista y recalcula el total.
 * No muta el array original.
 * @param {Array<{id:number, cantidad:number, precio_unitario:number}>} items
 * @param {number} itemId
 * @param {number} nuevaCantidad - debe ser >= 1
 * @returns {{ items: Array, total: number }}
 */
export function updateItemQty(items, itemId, nuevaCantidad) {
  const updated = items.map(i =>
    i.id === itemId ? { ...i, cantidad: nuevaCantidad } : i
  );
  const total = updated.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0);
  return { items: updated, total };
}
