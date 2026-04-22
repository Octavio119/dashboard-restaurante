// Helper para llamadas al backend con JWT automático

const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Token expirado o inválido — limpiar sesión
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth:logout'));
    throw new Error('Sesión expirada');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (nombre, email, password, rol) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ nombre, email, password, rol }) }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  refreshToken: (refresh_token) =>
    request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token }) }),
  changePassword: (current_password, new_password) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify({ current_password, new_password }) }),

  // Pedidos
  getPedidos: (fecha) => request(`/pedidos${fecha ? `?fecha=${fecha}` : ''}`),
  getPedidosPeriodo: (periodo) => request(`/pedidos?periodo=${periodo}`),
  getVentas: (periodo) => request(`/pedidos/ventas?periodo=${periodo}`),
  getPedidosPorMesa: () => request('/pedidos/por-mesa'),
  createPedido: (data) => request('/pedidos', { method: 'POST', body: JSON.stringify(data) }),
  updatePedidoEstado: (id, estado, extra = {}) =>
    request(`/pedidos/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado, ...extra }) }),
  deletePedido: (id, adminCode) => request(`/pedidos/${id}`, { method: 'DELETE', body: JSON.stringify({ admin_code: adminCode }) }),
  addPedidoItem: (pedidoId, data) => request(`/pedidos/${pedidoId}/items`, { method: 'POST', body: JSON.stringify(data) }),
  updatePedidoItem: (pedidoId, itemId, data) => request(`/pedidos/${pedidoId}/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePedidoItem: (pedidoId, itemId) => request(`/pedidos/${pedidoId}/items/${itemId}`, { method: 'DELETE' }),

  // Reservas
  getReservas: (fecha) => request(`/reservas${fecha ? `?fecha=${fecha}` : ''}`),
  getReservasPeriodo: (periodo) => request(`/reservas?periodo=${periodo}`),
  getTotalesReservas: (periodo) => request(`/reservas/totales?periodo=${periodo}`),
  createReserva: (data) => request('/reservas', { method: 'POST', body: JSON.stringify(data) }),
  updateReservaEstado: (id, estado) =>
    request(`/reservas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),
  deleteReserva: (id, adminCode) => request(`/reservas/${id}`, { method: 'DELETE', body: JSON.stringify({ admin_code: adminCode }) }),
  backfillClientes: () => request('/reservas/backfill-clientes', { method: 'POST' }),
  crearPedidoDesdeReserva: (reservaId) => request(`/reservas/${reservaId}/crear-pedido`, { method: 'POST' }),

  // Consumo en Reservas
  getReservaConsumos: (reservaId) => request(`/reservas/${reservaId}/consumos`),
  addReservaConsumo: (reservaId, data) => request(`/reservas/${reservaId}/consumos`, { method: 'POST', body: JSON.stringify(data) }),
  deleteReservaConsumo: (reservaId, consumoId) => request(`/reservas/${reservaId}/consumos/${consumoId}`, { method: 'DELETE' }),
  clearReservaConsumos: (reservaId) => request(`/reservas/${reservaId}/consumos`, { method: 'DELETE' }),

  // Clientes
  getClientes: (q) => request(`/clientes${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getCliente: (id) => request(`/clientes/${id}`),
  createCliente: (data) => request('/clientes', { method: 'POST', body: JSON.stringify(data) }),
  updateCliente: (id, data) => request(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCliente: (id, adminCode) => request(`/clientes/${id}`, { method: 'DELETE', body: JSON.stringify({ admin_code: adminCode }) }),

  // Categorías
  getCategorias: () => request('/categorias'),
  createCategoria: (nombre) => request('/categorias', { method: 'POST', body: JSON.stringify({ nombre }) }),
  updateCategoria: (id, nombre) => request(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify({ nombre }) }),
  deleteCategoria: (id) => request(`/categorias/${id}`, { method: 'DELETE' }),

  // Productos
  getProductos: (categoria) => request(`/productos${categoria ? `?categoria=${categoria}` : ''}`),
  createProducto: (data) => request('/productos', { method: 'POST', body: JSON.stringify(data) }),
  updateProducto: (id, data) => request(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStock: (id, delta) =>
    request(`/productos/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ delta }) }),
  deleteProducto: (id) => request(`/productos/${id}`, { method: 'DELETE' }),

  // Ventas
  getVentasDia: (fecha) => request(`/ventas${fecha ? `?fecha=${fecha}` : ''}`),
  getResumenVentas: (periodo) => request(`/ventas/resumen?periodo=${periodo}`),
  getAnalytics: () => request('/ventas/analytics'),
  createVenta: (data) => request('/ventas', { method: 'POST', body: JSON.stringify(data) }),
  deleteVenta: (id, adminCode) => request(`/ventas/${id}`, { method: 'DELETE', body: JSON.stringify({ admin_code: adminCode }) }),

  // Caja diaria
  getCajaHoy:  ()      => request('/caja/hoy'),
  abrirCaja:   (monto) => request('/caja/abrir',  { method: 'POST', body: JSON.stringify({ monto_inicial: monto }) }),
  cerrarCaja:  (monto) => request('/caja/cerrar', { method: 'POST', body: JSON.stringify({ monto_final:   monto }) }),

  // Config negocio
  getConfig: () => request('/config'),
  saveConfig: (data) => request('/config', { method: 'PUT', body: JSON.stringify(data) }),

  // Upload logo (multipart/form-data — no JSON, no Content-Type manual)
  uploadLogo: (file) => {
    const token = getToken();
    const form  = new FormData();
    form.append('logo', file);
    return fetch(`${BASE}/config/logo`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then(async res => {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:logout'));
        throw new Error('Sesión expirada');
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      return data;
    });
  },

  // Usuarios
  getUsuarios: () => request('/usuarios'),
  createUsuario: (data) => request('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  patchUsuario: (id, data) => request(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUsuario: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),

  // Inventario
  getProveedores: () => request('/inventario/proveedores'),
  createProveedor: (data) => request('/inventario/proveedores', { method: 'POST', body: JSON.stringify(data) }),
  updateProveedor: (id, data) => request(`/inventario/proveedores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProveedor: (id) => request(`/inventario/proveedores/${id}`, { method: 'DELETE' }),
  getMovimientos: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.tipo)        qs.set('tipo', params.tipo);
    if (params.producto_id) qs.set('producto_id', params.producto_id);
    if (params.fecha_desde) qs.set('fecha_desde', params.fecha_desde);
    if (params.fecha_hasta) qs.set('fecha_hasta', params.fecha_hasta);
    if (params.limit)       qs.set('limit', params.limit);
    if (params.offset)      qs.set('offset', params.offset);
    const query = qs.toString();
    return request(`/inventario/movimientos${query ? '?' + query : ''}`);
  },
  createMovimiento: (data) => request('/inventario/movimientos', { method: 'POST', body: JSON.stringify(data) }),
};
