import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/tests/**/*.test.{js,jsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    setupFiles: ['./src/tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      // Solo medir cobertura de archivos con tests activos
      include: [
        'src/lib/pedidoQtyUtils.js',
        'src/api.js',
        'src/AuthContext.jsx',
      ],
      // Thresholds incrementales — aumentar al agregar tests de App.jsx
      thresholds: {
        'src/lib/pedidoQtyUtils.js': { lines: 95, functions: 95 },
        'src/api.js':                { lines: 15, functions: 5 },
        'src/AuthContext.jsx':       { lines: 70, functions: 70 },
      },
    },
  },
});
