// Helper para llamadas al backend con JWT automático

const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('token');
}

// Estado global para evitar múltiples llamadas concurrentes a /auth/refresh
let _isRefreshing = false;
let _refreshQueue = []; // [{ resolve, reject }]

function _processQueue(error, newToken = null) {
  _refreshQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(newToken));
  _refreshQueue = [];
}

function _clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth:logout'));
}

async function _doRefresh() {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('Sin refresh token');
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Refresh fallido');
  localStorage.setItem('token', data.token);
  if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
  return data.token;
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers }).catch(() => {
    throw new Error('No se pudo conectar con el servidor. Asegúrate de que el backend esté corriendo (npm run dev:full).');
  });

  if (res.status === 401) {
    // No reintentar si el propio refresh/login falla
    if (path === '/auth/refresh' || path === '/auth/login') {
      _clearSession();
      throw new Error('Sesión expirada');
    }

    // Si ya hay un refresh en curso, encolar esta request
    if (_isRefreshing) {
      return new Promise((resolve, reject) => {
        _refreshQueue.push({ resolve, reject });
      }).then(newToken => _retryRequest(path, options, newToken));
    }

    _isRefreshing = true;
    try {
      const newToken = await _doRefresh();
      _processQueue(null, newToken);
      return _retryRequest(path, options, newToken);
    } catch (err) {
      _processQueue(err);
      _clearSession();
      throw new Error('Sesión expirada');
    } finally {
      _isRefreshing = false;
    }
  }

  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok) {
    _handlePlanError(data);
    if (!data.error && res.status >= 500) {
      throw new Error('El servidor no respondió correctamente. Asegúrate de correr el backend con npm run dev:full.');
    }
    throw new Error(data.error || `Error ${res.status}`);
  }
  return data;
}

function _handlePlanError(data) {
  if (data.error === 'plan_required' || data.error === 'limite_alcanzado') {
    window.dispatchEvent(new CustomEvent('upgrade_required', { detail: data }));
  }
}

async function _retryRequest(path, options, newToken) {
  const retryHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${newToken}`,
    ...options.headers,
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers: retryHeaders });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok) {
    _handlePlanError(data);
    if (!data.error && res.status >= 500) {
      throw new Error('El servidor no respondió correctamente. Asegúrate de correr el backend con npm run dev:full.');
    }
    throw new Error(data.error || `Error ${res.status}`);
  }
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
  getVentasDia: (fecha) => request(`/ventas${fecha ? `?fecha=${fecha}` : ''}`).then(r => Array.isArray(r) ? r : (r?.rows ?? [])),
  getResumenVentas: (periodo) => request(`/ventas/resumen?periodo=${periodo}`),
  getAnalytics:    () => request('/analytics/ventas'),
  getSalesChart:   (dias = 7) => request(`/ventas/chart?dias=${dias}`),
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
  uploadLogo: async (file) => {
    const doUpload = async (token) => {
      const form = new FormData();
      form.append('logo', file);
      return fetch(`${BASE}/config/logo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
    };

    let res = await doUpload(getToken());
    if (res.status === 401) {
      if (_isRefreshing) {
        const newToken = await new Promise((resolve, reject) => {
          _refreshQueue.push({ resolve, reject });
        });
        res = await doUpload(newToken);
      } else {
        _isRefreshing = true;
        try {
          const newToken = await _doRefresh();
          _processQueue(null, newToken);
          res = await doUpload(newToken);
        } catch (err) {
          _processQueue(err);
          _clearSession();
          throw new Error('Sesión expirada');
        } finally {
          _isRefreshing = false;
        }
      }
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
  },

  // Usuarios
  getUsuarios: () => request('/usuarios'),
  createUsuario: (data) => request('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  patchUsuario: (id, data) => request(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUsuario: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),

  // Billing
  getBillingUsage:   ()          => request('/billing/usage'),
  createCheckout:    (plan)      => request('/billing/checkout', { method: 'POST', body: JSON.stringify({ plan }) }),
  captureCheckout:   (orderId)   => request('/billing/capture',  { method: 'POST', body: JSON.stringify({ orderId }) }),
  getBillingPortal:  ()          => request('/billing/portal'),
  signup: (nombre_restaurante, email, password, nombre_admin) =>
    request('/auth/signup', { method: 'POST', body: JSON.stringify({ nombre_restaurante, email, password, nombre_admin }) }),

  // Payments — PayPal one-time capture
  createPaypalOrder: (pedido_id) =>
    request('/payments/paypal/create-order', { method: 'POST', body: JSON.stringify({ pedido_id }) }),
  capturePaypalOrder: (orderID, pedido_id) =>
    request('/payments/paypal/capture-order', { method: 'POST', body: JSON.stringify({ orderID, pedido_id }) }),

  // API Keys (plan business)
  getApiKeys: () => request('/apikeys'),
  createApiKey: (nombre) => request('/apikeys', { method: 'POST', body: JSON.stringify({ nombre }) }),
  revokeApiKey: (id) => request(`/apikeys/${id}`, { method: 'DELETE' }),

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
