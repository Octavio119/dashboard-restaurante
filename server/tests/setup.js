// Jest globals are available here (beforeAll, afterAll, etc.)
const prisma = require('../lib/prisma');

beforeAll(async () => {
  // Asegurar que el restaurante de test existe
  await prisma.restaurante.upsert({
    where: { id: 1 },
    create: { id: 1, nombre: 'Test Restaurant', slug: 'test-restaurant', plan: 'basic', activo: true },
    update: {},
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
