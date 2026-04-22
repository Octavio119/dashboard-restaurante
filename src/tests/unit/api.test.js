import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';

vi.unmock('../../api');

let api;

beforeAll(async () => {
  const mod = await import('../../api.js');
  api = mod.api;
});

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('api request wrapper', () => {
  it('añade Authorization header cuando hay token en localStorage', async () => {
    localStorage.setItem('token', 'mi-token-abc');

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    await api.me();

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer mi-token-abc');
  });

  it('NO añade Authorization si no hay token', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    await api.me();

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('lanza error con mensaje del servidor en respuestas no-ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'nombre requerido' }),
    });

    await expect(api.me()).rejects.toThrow('nombre requerido');
  });

  it('limpia localStorage y dispara auth:logout en respuesta 401', async () => {
    localStorage.setItem('token', 'expired');
    localStorage.setItem('user', JSON.stringify({ nombre: 'X' }));

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Token inválido' }),
    });

    const logoutEvents = [];
    const handler = () => logoutEvents.push(1);
    window.addEventListener('auth:logout', handler);

    await expect(api.me()).rejects.toThrow('Sesión expirada');

    window.removeEventListener('auth:logout', handler);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(logoutEvents.length).toBe(1);
  });

  it('api.login hace POST /api/auth/login con email y password', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ token: 'tok', refresh_token: 'ref', user: { nombre: 'Ana' } }),
    });

    await api.login('ana@test.com', 'pw');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/auth/login');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ email: 'ana@test.com', password: 'pw' });
  });
});
