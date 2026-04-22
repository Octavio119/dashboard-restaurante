import { describe, it, expect } from 'vitest';
import { updateItemQty } from '../../lib/pedidoQtyUtils.js';

const mockItems = [
  { id: 1, nombre: 'Hamburguesa', cantidad: 2, precio_unitario: 8500 },
  { id: 2, nombre: 'Refresco',    cantidad: 1, precio_unitario: 2000 },
];

describe('updateItemQty', () => {
  it('incrementa cantidad del ítem correcto', () => {
    const { items } = updateItemQty(mockItems, 1, 3);
    expect(items[0].cantidad).toBe(3);
    expect(items[1].cantidad).toBe(1);
  });

  it('decrementa cantidad del ítem correcto', () => {
    const { items } = updateItemQty(mockItems, 1, 1);
    expect(items[0].cantidad).toBe(1);
  });

  it('recalcula total correctamente al incrementar', () => {
    // id=1: 3x8500=25500, id=2: 1x2000=2000 → total=27500
    const { total } = updateItemQty(mockItems, 1, 3);
    expect(total).toBe(27500);
  });

  it('recalcula total correctamente al decrementar', () => {
    // id=1: 1x8500=8500, id=2: 1x2000=2000 → total=10500
    const { total } = updateItemQty(mockItems, 1, 1);
    expect(total).toBe(10500);
  });

  it('no muta el array original', () => {
    const originalCantidad = mockItems[0].cantidad;
    updateItemQty(mockItems, 1, 99);
    expect(mockItems[0].cantidad).toBe(originalCantidad);
  });

  it('no modifica otros ítems del pedido', () => {
    const { items } = updateItemQty(mockItems, 2, 4);
    expect(items[0].cantidad).toBe(mockItems[0].cantidad);
    expect(items[1].cantidad).toBe(4);
  });

  it('retorna total 0 con lista vacía', () => {
    const { total } = updateItemQty([], 1, 1);
    expect(total).toBe(0);
  });

  it('retorna items sin cambio si el itemId no existe', () => {
    const { items, total } = updateItemQty(mockItems, 999, 5);
    expect(items[0].cantidad).toBe(mockItems[0].cantidad);
    // total original: 2*8500 + 1*2000 = 19000
    expect(total).toBe(19000);
  });
});
