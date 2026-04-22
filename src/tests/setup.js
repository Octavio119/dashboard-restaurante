import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Node.js 25 tiene localStorage nativo que NO es Web Storage API
// Reemplazamos con una implementación compatible con jsdom/browser
function createStorageMock() {
  let store = {};
  return {
    getItem:    (k) => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear:      () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key:        (i) => Object.keys(store)[i] ?? null,
  };
}

const localStorageMock = createStorageMock();
vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('sessionStorage', createStorageMock());

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
  })),
}));

// Mock api module
vi.mock('../api', () => ({
  api: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    refreshToken: vi.fn(),
    getPedidos: vi.fn(),
    createPedido: vi.fn(),
    updatePedidoEstado: vi.fn(),
    addPedidoItem: vi.fn(),
    deletePedidoItem: vi.fn(),
    getProductos: vi.fn(),
    createProducto: vi.fn(),
    updateProducto: vi.fn(),
    deleteProducto: vi.fn(),
    changePassword: vi.fn(),
  },
}));

// Limpiar mocks entre tests
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});
