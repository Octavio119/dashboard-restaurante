import { test, expect } from '@playwright/test';

test.describe('Flujo de Login', () => {
  test('login exitoso navega al dashboard', async ({ page }) => {
    await page.goto('/');

    // Esperar pantalla de login
    await expect(page.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="correo" i]'))
      .toBeVisible({ timeout: 10000 });

    // Completar formulario
    await page.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="correo" i]')
      .fill('admin@test.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Ingresar"), button:has-text("Login")')
      .click();

    // Verificar que salió del login (cambia la URL o aparece contenido del dashboard)
    await expect(page.locator('text=/pedidos|dashboard|bienvenido|reservas/i').first())
      .toBeVisible({ timeout: 10000 });
  });

  test('login con credenciales incorrectas muestra error', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input[type="email"], input[placeholder*="email" i]'))
      .toBeVisible({ timeout: 10000 });

    await page.locator('input[type="email"], input[placeholder*="email" i]').fill('noexiste@test.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Ingresar"), button:has-text("Login")')
      .click();

    // Debe aparecer algún mensaje de error
    await expect(page.locator('text=/inválid|incorrecta|error|credenciales/i').first())
      .toBeVisible({ timeout: 5000 });
  });
});
