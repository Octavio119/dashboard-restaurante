const request = require('supertest');
const bcrypt  = require('bcryptjs');
const { app } = require('../../app');
const prisma  = require('../../lib/prisma');

// Limpia usuarios y tokens de test después de cada bloque
afterEach(async () => {
  await prisma.metadata.deleteMany({ where: { key: { startsWith: 'refresh:' } } });
  await prisma.usuario.deleteMany({ where: { email: { endsWith: '@authtest.com' } } });
});

async function seedUser(email, password, rol = 'admin') {
  const hash = await bcrypt.hash(password, 10);
  return prisma.usuario.create({
    data: { nombre: 'Auth Test User', email, password_hash: hash, rol, restaurante_id: 1 },
  });
}

describe('POST /api/auth/login', () => {
  it('retorna token con credenciales válidas', async () => {
    await seedUser('valid@authtest.com', 'secret123');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'valid@authtest.com', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refresh_token');
    expect(res.body.user.email).toBe('valid@authtest.com');
  });

  it('retorna 401 con contraseña incorrecta', async () => {
    await seedUser('wrong@authtest.com', 'correct_pw');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@authtest.com', password: 'wrong_pw' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('retorna 400 si falta el campo password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'incomplete@authtest.com' });

    expect(res.status).toBe(400);
  });

  it('retorna 400 si falta el campo email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'algo' });

    expect(res.status).toBe(400);
  });

  it('retorna 401 con email inexistente', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@authtest.com', password: 'algo' });

    expect(res.status).toBe(401);
  });

  it('el email es case-insensitive', async () => {
    await seedUser('case@authtest.com', 'pw');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'CASE@AUTHTEST.COM', password: 'pw' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});

describe('POST /api/auth/refresh', () => {
  it('emite nuevo token con refresh_token válido', async () => {
    await seedUser('refresh@authtest.com', 'pw');
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'refresh@authtest.com', password: 'pw' });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refresh_token: login.body.refresh_token });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('retorna 401 con refresh_token inválido', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refresh_token: 'token-completamente-falso' });

    expect(res.status).toBe(401);
  });

  it('retorna 400 sin refresh_token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('GET /api/health', () => {
  it('retorna { ok: true } sin autenticación', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body).toHaveProperty('ts');
  });
});

describe('Rutas protegidas sin token', () => {
  it('GET /api/pedidos retorna 401 sin token', async () => {
    const res = await request(app).get('/api/pedidos');
    expect(res.status).toBe(401);
  });

  it('GET /api/productos retorna 401 sin token', async () => {
    const res = await request(app).get('/api/productos');
    expect(res.status).toBe(401);
  });
});
