const request = require('supertest');
const { app } = require('../../app');
const prisma  = require('../../lib/prisma');
const { createTestUser } = require('../helpers/auth');

let token;
let categoriaId;
const CATEGORIA_NOMBRE = 'Pizzas Test';

beforeAll(async () => {
  ({ token } = await createTestUser(app, { rol: 'admin', email: 'prod-admin@prodtest.com' }));

  // La ruta POST /api/productos requiere que la categoría exista
  const cat = await prisma.categoria.create({
    data: { nombre: CATEGORIA_NOMBRE, restaurante_id: 1 },
  });
  categoriaId = cat.id;
});

afterAll(async () => {
  await prisma.inventarioMovimiento.deleteMany({ where: { restaurante_id: 1 } });
  await prisma.producto.deleteMany({ where: { categoria: CATEGORIA_NOMBRE, restaurante_id: 1 } });
  await prisma.categoria.deleteMany({ where: { id: categoriaId } });
  await prisma.metadata.deleteMany({ where: { key: { startsWith: 'refresh:' } } });
  await prisma.usuario.deleteMany({ where: { email: { endsWith: '@prodtest.com' } } });
});

describe('POST /api/productos', () => {
  it('crea producto con campos válidos', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Pizza Mozzarella', categoria: CATEGORIA_NOMBRE, precio: 12000, stock: 15 });

    expect(res.status).toBe(201);
    expect(res.body.nombre).toBe('Pizza Mozzarella');
    expect(res.body.precio).toBe(12000);
    expect(res.body.activo).toBe(true);
  });

  it('retorna 400 sin nombre', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoria: CATEGORIA_NOMBRE, precio: 5000 });

    expect(res.status).toBe(400);
  });

  it('retorna 400 sin precio', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Sin precio', categoria: CATEGORIA_NOMBRE });

    expect(res.status).toBe(400);
  });

  it('retorna 400 si la categoría no existe', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Huérfano', categoria: 'CategoríaInexistente', precio: 1000 });

    expect(res.status).toBe(400);
  });

  it('retorna 401 sin token', async () => {
    const res = await request(app)
      .post('/api/productos')
      .send({ nombre: 'No auth', categoria: CATEGORIA_NOMBRE, precio: 1000 });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/productos', () => {
  it('retorna solo productos activos', async () => {
    // Crear uno activo y uno inactivo
    await prisma.producto.create({
      data: { nombre: 'Activo GET Test', precio: 1000, stock: 5, categoria: CATEGORIA_NOMBRE, activo: true, restaurante_id: 1 },
    });
    await prisma.producto.create({
      data: { nombre: 'Inactivo GET Test', precio: 2000, stock: 0, categoria: CATEGORIA_NOMBRE, activo: false, restaurante_id: 1 },
    });

    const res = await request(app)
      .get('/api/productos')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(p => p.nombre === 'Inactivo GET Test')).toBe(false);
    expect(res.body.some(p => p.nombre === 'Activo GET Test')).toBe(true);
  });

  it('filtra por categoría', async () => {
    const res = await request(app)
      .get(`/api/productos?categoria=${encodeURIComponent(CATEGORIA_NOMBRE)}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.forEach(p => expect(p.categoria).toBe(CATEGORIA_NOMBRE));
  });
});

describe('PUT /api/productos/:id', () => {
  let productoId;

  beforeEach(async () => {
    const prod = await prisma.producto.create({
      data: { nombre: 'Para editar', precio: 5000, stock: 10, categoria: CATEGORIA_NOMBRE, restaurante_id: 1 },
    });
    productoId = prod.id;
  });

  it('actualiza precio y nombre', async () => {
    const res = await request(app)
      .put(`/api/productos/${productoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Editado', categoria: CATEGORIA_NOMBRE, precio: 7500, stock: 10 });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe('Editado');
    expect(res.body.precio).toBe(7500);
  });

  it('retorna 404 con producto inexistente', async () => {
    const res = await request(app)
      .put('/api/productos/999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'X', categoria: CATEGORIA_NOMBRE, precio: 1000 });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/productos/:id (soft delete)', () => {
  it('marca producto como inactivo', async () => {
    const prod = await prisma.producto.create({
      data: { nombre: 'Para borrar', precio: 1000, stock: 5, categoria: CATEGORIA_NOMBRE, restaurante_id: 1 },
    });

    const res = await request(app)
      .delete(`/api/productos/${prod.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    // Verificar que sigue en DB pero inactivo
    const updated = await prisma.producto.findUnique({ where: { id: prod.id } });
    expect(updated.activo).toBe(false);
  });
});
