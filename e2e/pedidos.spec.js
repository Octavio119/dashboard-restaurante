import { test, expect } from '@playwright/test';

async function loginAsAdmin(page) {
  await page.goto('/');
  await page.locator('input[type="email"], input[placeholder*="email" i]').fill('admin@test.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Ingresar")').click();
  await expect(page.locator('text=/pedidos|dashboard|reservas/i').first()).toBeVisible({ timeout: 10000 });
}

test.describe('Botones +/- en pedido (sin error 404)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('botones de cantidad no generan error 404', async ({ page }) => {
    // Capturar respuestas 404
    const errores404 = [];
    page.on('response', resp => {
      if (resp.status() === 404 && resp.url().includes('/api/')) {
        errores404.push(resp.url());
      }
    });

    // Ir a sección de pedidos
    const pedidosBtn = page.locator('[data-testid="nav-pedidos"], button:has-text("Pedidos"), a:has-text("Pedidos")').first();
    if (await pedidosBtn.isVisible()) await pedidosBtn.click();

    // Si hay pedidos abiertos, intentar cambiar cantidad
    const primerPedido = page.locator('[data-testid="pedido-item"]').first();
    if (await primerPedido.isVisible({ timeout: 3000 }).catch(() => false)) {
      await primerPedido.click();
      await page.waitForTimeout(500);

      const btnMas = page.locator('button:has-text("+")').first();
      if (await btnMas.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btnMas.click();
        await page.waitForTimeout(500);
      }
    }

    expect(errores404, `Llamadas 404 detectadas: ${errores404.join(', ')}`).toHaveLength(0);
  });

  test('cantidad en UI actualiza sin recargar página', async ({ page }) => {
    const pedidosBtn = page.locator('[data-testid="nav-pedidos"], button:has-text("Pedidos"), a:has-text("Pedidos")').first();
    if (await pedidosBtn.isVisible()) await pedidosBtn.click();

    const primerPedido = page.locator('[data-testid="pedido-item"]').first();
    const hayPedido = await primerPedido.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hayPedido) {
      test.skip();
      return;
    }

    await primerPedido.click();

    const cantidadEl = page.locator('[data-testid="item-cantidad"]').first();
    const hayItem = await cantidadEl.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hayItem) {
      test.skip();
      return;
    }

    const cantidadInicial = parseInt(await cantidadEl.textContent() || '1');
    await page.locator('button:has-text("+")').first().click();

    await expect(cantidadEl).toHaveText(String(cantidadInicial + 1), { timeout: 3000 });
  });
});
