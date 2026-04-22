const request = require('supertest');
const bcrypt  = require('bcryptjs');
const prisma  = require('../../lib/prisma');

/**
 * Crea usuario de test en DB y retorna token JWT.
 * @param {import('express').Express} app
 * @param {{ rol?: string, email?: string }} opts
 * @returns {Promise<{ token: string, user: object }>}
 */
async function createTestUser(app, opts = {}) {
  const rol   = opts.rol   || 'admin';
  const email = opts.email || `${rol}-${Date.now()}@test.com`;

  const hash = await bcrypt.hash('password123', 10);
  const user = await prisma.usuario.create({
    data: {
      nombre:         `Test ${rol}`,
      email,
      password_hash:  hash,
      rol,
      restaurante_id: 1,
    },
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' });

  if (!res.body.token) throw new Error(`Login falló: ${JSON.stringify(res.body)}`);

  return { token: res.body.token, user };
}

module.exports = { createTestUser };
