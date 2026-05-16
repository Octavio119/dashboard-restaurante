/**
 * tenant-isolation.test.js
 *
 * Tests de seguridad: verifica que un restaurante (tenant) nunca puede
 * acceder ni modificar los datos de otro restaurante, incluso con un JWT válido.
 *
 * Estructura:
 *   - Restaurante 1 (id=1): creado en tests/setup.js
 *   - Restaurante 2: creado aquí como rival
 *   - Recursos de R1: producto + pedido
 *   - Token de R2 intenta leer/modificar recursos de R1
 */

const request = require('supertest');
const bcrypt  = require('bcryptjs');
const { app } = require('../../app');
const prisma  = require('../../lib/prisma');
const { createTestUser } = require('../helpers/auth');

const ADMIN_CODE = process.env.ADMIN_CODE;

let token1;       // JWT autenticado como admin de restaurante 1
let token2;       // JWT autenticado como admin de restaurante 2
let rest2Id;      // ID del restaurante rival (creado en beforeAll)
let prod1Id;      // Producto que pertenece a restaurante 1
let pedido1Id;    // Pedido que pertenece a restaurante 1
let email2;       // Email del usuario rival (para cleanup)

beforeAll(async () => {
  // ── Restaurante 1: usa el que ya existe en setup.js ──────────────────────────
  ({ token: token1 } = await createTestUser(app, {
    rol:   'admin',
    email: 'r1-iso@isolation.test',
  }));

  // ── Restaurante 2: crear uno nuevo completamente aislado ──────────────────────
  email2 = `r2-iso-${Date.now()}@isolation.test`;
  const hash = await bcrypt.hash('pass-rival-123', 10);

  // Crear restaurante 2 directamente con Prisma (sin contexto → sin inyección)
  const rest2 = await prisma.restaurante.create({
    data: {
      nombre:  'Restaurante Rival Test',
      slug:    `rival-iso-${Date.now()}`,
      plan:    'free',
      activo:  true,
    },
  });
  rest2Id = rest2.id;

  // Crear usuario para restaurante 2 (mismo Prisma directo, sin contexto)
  await prisma.usuario.create({
    data: {
      nombre:        'Admin Rival',
      email:         email2,
      password_hash: hash,
      rol:           'admin',
      restaurante_id: rest2Id,
    },
  });

  // Login como restaurante 2 → token2
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: email2, password: 'pass-rival-123' });

  expect(loginRes.status).toBe(200);
  token2 = loginRes.body.token;

  // ── Recursos de restaurante 1 ─────────────────────────────────────────────────
  // Asegurar categoría para el producto
  await prisma.categoria.upsert({
    where:  { nombre_restaurante_id: { nombre: 'IsoTest', restaurante_id: 1 } },
    create: { nombre: 'IsoTest', restaurante_id: 1 },
    update: {},
  });

  const prod = await prisma.producto.create({
    data: {
      nombre:         'Producto Secreto R1',
      categoria:      'IsoTest',
      precio:         999,
      stock:          50,
      restaurante_id: 1,
    },
  });
  prod1Id = prod.id;

  const pedido = await prisma.pedido.create({
    data: {
      numero:          `#ISO-${Date.now()}`,
      cliente_nombre:  'Cliente Secreto R1',
      item:            'Producto Secreto R1',
      total:           999,
      estado:          'pendiente',
      fecha:           new Date(),
      restaurante_id:  1,
    },
  });
  pedido1Id = pedido.id;
});

afterAll(async () => {
  // Borrar en orden que respeta FK constraints
  await prisma.pedidoItem.deleteMany({ where: { pedido_id: pedido1Id } });
  await prisma.pedido.deleteMany({ where: { id: pedido1Id } });
  await prisma.producto.deleteMany({ where: { id: prod1Id } });
  await prisma.categoria.deleteMany({ where: { nombre: 'IsoTest', restaurante_id: 1 } });
  await prisma.usuario.deleteMany({ where: { email: { endsWith: '@isolation.test' } } });
  await prisma.restaurante.deleteMany({ where: { id: rest2Id } });
  await prisma.metadata.deleteMany({ where: { key: { startsWith: 'refresh:' } } });
});

// ─── Lecturas cross-tenant ────────────────────────────────────────────────────

describe('GET cross-tenant — restaurante 2 no ve datos de restaurante 1', () => {
  it('GET /api/productos — no incluye productos de R1 en la respuesta', async () => {
    const res = await request(app)
      .get('/api/productos')
      .set('Authorization', `Bearer ${token2}`);

    expect(res.status).toBe(200);
    const ids = res.body.map(p => p.id);
    expect(ids).not.toContain(prod1Id);
  });

  it('GET /api/pedidos — no incluye pedidos de R1 en la respuesta', async () => {
    const res = await request(app)
      .get('/api/pedidos')
      .set('Authorization', `Bearer ${token2}`);

    expect(res.status).toBe(200);
    const rows = res.body.rows ?? res.body;
    const ids = rows.map(p => p.id);
    expect(ids).not.toContain(pedido1Id);
  });
});

// ─── Mutaciones cross-tenant ──────────────────────────────────────────────────

describe('PUT/PATCH cross-tenant — restaurante 2 no puede modificar datos de R1', () => {
  it('PUT /api/productos/:id — retorna 404 al editar producto de R1', async () => {
    const res = await request(app)
      .put(`/api/productos/${prod1Id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ nombre: 'Hackeado', categoria: 'IsoTest', precio: 1 });

    expect(res.status).toBe(404);
  });

  it('PATCH /api/productos/:id/stock — retorna 404 al modificar stock de R1', async () => {
    const res = await request(app)
      .patch(`/api/productos/${prod1Id}/stock`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ delta: -999 });

    expect(res.status).toBe(404);
  });

  it('PATCH /api/pedidos/:id/estado — retorna 404 al cambiar estado de pedido de R1', async () => {
    const res = await request(app)
      .patch(`/api/pedidos/${pedido1Id}/estado`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ estado: 'cancelado' });

    expect(res.status).toBe(404);
  });
});

// ─── Eliminaciones cross-tenant ───────────────────────────────────────────────

describe('DELETE cross-tenant — restaurante 2 no puede eliminar datos de R1', () => {
  it('DELETE /api/pedidos/:id — retorna 404 al intentar eliminar pedido de R1', async () => {
    const res = await request(app)
      .delete(`/api/pedidos/${pedido1Id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ admin_code: ADMIN_CODE });

    expect(res.status).toBe(404);
  });
});

// ─── Token inválido / manipulado ─────────────────────────────────────────────

describe('Token inválido — rechazado en todas las rutas protegidas', () => {
  it('Token con firma alterada retorna 401', async () => {
    // Separamos header.payload de la firma y la cambiamos a basura
    const [header, payload] = token1.split('.');
    const fakeToken = `${header}.${payload}.firma-invalida-manipulada`;

    const res = await request(app)
      .get('/api/pedidos')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.status).toBe(401);
  });

  it('Token sin Bearer prefix retorna 401', async () => {
    const res = await request(app)
      .get('/api/pedidos')
      .set('Authorization', token2);

    expect(res.status).toBe(401);
  });
});

// ─── Sanity check: R1 sí puede ver y modificar sus propios datos ──────────────

describe('Same-tenant — restaurante 1 accede correctamente a sus propios datos', () => {
  it('GET /api/productos — R1 ve su propio producto', async () => {
    const res = await request(app)
      .get('/api/productos')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
    const ids = res.body.map(p => p.id);
    expect(ids).toContain(prod1Id);
  });

  it('PATCH /api/productos/:id/stock — R1 puede modificar su propio stock', async () => {
    const res = await request(app)
      .patch(`/api/productos/${prod1Id}/stock`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ delta: 1 });

    expect(res.status).toBe(200);
    expect(res.body.stock).toBeDefined();
  });
});
