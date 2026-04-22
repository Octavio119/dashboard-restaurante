const { AsyncLocalStorage } = require('async_hooks');

/**
 * AsyncLocalStorage permite guardar datos vinculados al hilo de ejecución actual.
 * Lo usamos para que el cliente Prisma siempre sepa qué restaurante_id usar
 * sin tener que pasarlo como argumento a cada función.
 */
const contextStore = new AsyncLocalStorage();

module.exports = {
  contextStore,
  
  /**
   * Obtiene el restaurante_id del contexto actual.
   */
  getRestaurantId: () => {
    const store = contextStore.getStore();
    return store ? store.restaurante_id : null;
  },

  /**
   * Ejecuta una función dentro de un contexto específico.
   */
  runWithContext: (id, fn) => {
    return contextStore.run({ restaurante_id: parseInt(id) }, fn);
  }
};
