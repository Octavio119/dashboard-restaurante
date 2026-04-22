import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // En CI lanza frontend + backend automáticamente
  webServer: process.env.CI
    ? [
        {
          command: 'node server/index.js',
          url: 'http://localhost:9000/api/health',
          timeout: 30000,
        },
        {
          command: 'npm run build && npx serve dist -p 5173',
          url: 'http://localhost:5173',
          timeout: 60000,
        },
      ]
    : [],
});
