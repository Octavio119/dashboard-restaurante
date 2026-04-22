const request = require('supertest');
const { app } = require('../../app');
const prisma  = require('../../lib/prisma');
const { createTestUser } = require('../helpers/auth');

let token;
let productoId;

beforeAll(async () => {
  ({ token } = await createTestUser(app, { rol: 'admin', email: 'pedidos-admin@pedtest.com' }));

  const prod = await prisma.producto.create({
    data: {
      nombre:        'Hamburguesa Test',
      precio:        8500,
      stock:         50,
      stock_minimo:  2,
      categoria:     'Principales',
      restaurante_id: 1,
    },
  });
  productoId = prod.id;
});

afterAll(async () => {
  // Orden de borrado respetando FK constraints
  await prisma.inventarioMovimiento.deleteMany({ where: { restaurante_id: 1 } });
  await prisma.pedidoItem.deleteMany({ where: { restaurante_id: 1 } });
  await prisma.pedido.deleteMany({ where: { restaurante_id: 1 } });
  await prisma.producto.deleteMany({ where: { id: productoId } });
  await prisma.metadata.deleteMany({ where: { key: { startsWith: 'refresh:' } } });
  await prisma.usuario.deleteMany({ where: { email: { endsWith: '@pedtest.com' } } });
});

describe('POST /api/pedidos', () => {
  it('crea pedido con items y retorna total correcto', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cliente_nombre: 'Mesa 3 Test',
        mesa: '3',
        items: [
          { producto_id: productoId, nombre: 'Hamburguesa Test', cantidad: 2, precio_unitario: 8500 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.total).toBe(17000);
    expect(res.body.estado).toBe('pendiente');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].cantidad).toBe(2);
  });

  it('retorna 401 sin token', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .send({ cliente_nombre: 'Sin auth', items: [] });

    expect(res.status).toBe(401);
  });

  it('retorna 400 sin cliente_nombre', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ nombre: 'X', cantidad: 1, precio_unitario: 1000 }] });

    expect(res.status).toBe(400);
  });

  it('retorna 400 sin items ni item+total', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({ cliente_nombre: 'Vacío' });

    expect(res.status).toBe(400);
  });

  it('genera número de pedido con formato #ORD-XXXX', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cliente_nombre: 'Numero Test',
        items: [{ nombre: 'Item', cantidad: 1, precio_unitario: 1000 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.numero).toMatch(/#ORD-\d+/);
  });
});

describe('GET /api/pedidos', () => {
  it('retorna lista de pedidos del restaurante', async () => {
    const res = await request(app)
      .get('/api/pedidos')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('filtra por fecha específica', async () => {
    const hoy = new Date().toISOString().split('T')[0];
    const res = await request(app)
      .get(`/api/pedidos?fecha=${hoy}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach(p => expect(p.fecha).toBe(hoy));
  });
});

describe('PATCH /api/pedidos/:id/estado', () => {
  let pedidoId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cliente_nombre: 'Estado Test',
        mesa: '9',
        items: [{ producto_id: productoId, nombre: 'Hamburguesa Test', cantidad: 1, precio_unitario: 8500 }],
      });
    pedidoId = res.body.id;
  });

  it('cambia estado a en preparación', async () => {
    const res = await request(app)
      .patch(`/api/pedidos/${pedidoId}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'en preparación' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('cambia estado a entregado', async () => {
    const res = await request(app)
      .patch(`/api/pedidos/${pedidoId}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'entregado' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('retorna 404 con pedido inexistente', async () => {
    const res = await request(app)
      .patch('/api/pedidos/999999/estado')
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'entregado' });

    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/pedidos/:id/items/:itemId (qty update)', () => {
  it('actualiza cantidad de ítem y recalcula total', async () => {
    const created = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cliente_nombre: 'Qty Test',
        items: [{ producto_id: productoId, nombre: 'Hamburguesa Test', cantidad: 1, precio_unitario: 8500 }],
      });

    const itemId = created.body.items[0].id;

    const res = await request(app)
      .patch(`/api/pedidos/${created.body.id}/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ cantidad: 3 });

    expect(res.status).toBe(200);
    expect(res.body.nuevoTotal).toBe(25500);
  });

  it('retorna 400 si cantidad es 0', async () => {
    const created = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cliente_nombre: 'Qty Zero Test',
        items: [{ nombre: 'Item', cantidad: 1, precio_unitario: 1000 }],
      });

    const itemId = created.body.items[0].id;

    const res = await request(app)
      .patch(`/api/pedidos/${created.body.id}/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ cantidad: 0 });

    expect(res.status).toBe(400);
  });
});
