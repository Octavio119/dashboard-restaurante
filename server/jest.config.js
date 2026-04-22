module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'routes/auth.js',
    'routes/pedidos.js',
    'routes/productos.js',
    'middleware/auth.js',
  ],
  // Thresholds incrementales — aumentar al agregar más tests
  coverageThreshold: {
    'routes/auth.js':       { lines: 45, functions: 50 },
    'routes/pedidos.js':    { lines: 40, functions: 50 },
    'routes/productos.js':  { lines: 65, functions: 75 },
    'middleware/auth.js':   { lines: 85, functions: 95 },
  },
  setupFiles: ['./tests/env-setup.js'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 30000,
};
