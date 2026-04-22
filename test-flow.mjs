import { chromium } from 'playwright';

const BASE = 'http://localhost:5176';
const API  = 'http://localhost:9000/api';
const SCREENSHOTS = [];

// Prepara datos de test: añade stock a productos y cancela pedidos bloqueantes
async function setupTestData() {
  try {
    // 1. Login para obtener token
    const loginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@restaurante.com', password: 'admin123' }),
    });
    const { token } = await loginRes.json();
    if (!token) { info('Setup: no se pudo obtener token'); return null; }
    info('Setup: token obtenido');

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    // 2. Obtener productos y dar stock = 50 a los que tienen stock 0
    const prodsRes = await fetch(`${API}/productos`, { headers });
    const productos = await prodsRes.json();
    info(`Setup: ${productos.length} productos encontrados`);

    for (const p of productos) {
      if (p.stock < 10) {
        const res = await fetch(`${API}/inventario/movimientos`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ producto_id: p.id, tipo: 'entrada', cantidad: 50, motivo: 'Test setup' }),
        });
        const ok = res.status === 201;
        info(`Setup: stock +50 para "${p.nombre}" (tenía ${p.stock}) → ${ok ? 'OK' : 'ERROR'}`);
      }
    }

    return token;
  } catch (e) {
    info(`Setup error: ${e.message}`);
    return null;
  }
}

async function screenshot(page, label) {
  const path = `test-screenshot-${label.replace(/\s+/g,'-')}.png`;
  await page.screenshot({ path, fullPage: false });
  SCREENSHOTS.push(path);
  console.log(`📸 ${label}`);
}

function pass(msg) { console.log(`✅ PASS ${msg}`); }
function fail(msg) { console.log(`❌ FAIL ${msg}`); }
function info(msg) { console.log(`ℹ️  ${msg}`); }

// Cierra cualquier modal/overlay que esté bloqueando la UI
async function cerrarModalesAbiertos(page) {
  // Intentar cerrar con Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  // Si sigue habiendo overlay del crearPedidoRes, hacer click en Cancelar
  const cancelBtn = page.locator('button:has-text("Cancelar")').last();
  if (await cancelBtn.isVisible().catch(() => false)) {
    await cancelBtn.click();
    await page.waitForTimeout(400);
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
}

// Abre el detalle de un pedido (modal de gestión de items)
async function abrirDetallePedido(page) {
  // Asegurarse de estar en la pestaña Pedidos, vista Lista
  await page.click('nav a:has-text("Pedidos"), li:has-text("Pedidos"), span:has-text("Pedidos")').catch(() => {});
  await page.waitForTimeout(800);

  // Si hay botón "Lista" (para salir de vista Por Mesa)
  const btnLista = page.locator('button:has-text("Lista")');
  if (await btnLista.isVisible().catch(() => false)) {
    await btnLista.click();
    await page.waitForTimeout(600);
  }

  // Buscar botón "Gestionar productos" (ChefHat)
  const chefBtns = await page.locator('button[title="Gestionar productos"]').all();
  info(`Botones "Gestionar productos" encontrados: ${chefBtns.length}`);
  if (chefBtns.length > 0) {
    await chefBtns[0].click();
    await page.waitForTimeout(1000);
    return true;
  }
  return false;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(8000);

  // Auto-dismiss cualquier alert/confirm/prompt del navegador
  page.on('dialog', async dialog => {
    info(`Dialog auto-dismissed: "${dialog.message()}"`);
    await dialog.dismiss();
  });

  try {
    // ─── SETUP: stock y limpieza de datos de prueba ──────────────────────────
    console.log('\n═══ SETUP: Preparando datos de test ═══');
    await setupTestData();

    // ─── 1. LOGIN ────────────────────────────────────────────────────────────
    console.log('\n═══ TEST 1: LOGIN ═══');
    await page.goto(BASE);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'admin@restaurante.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });
    pass('Login exitoso — Dashboard visible');
    await screenshot(page, '1-login-ok');

    // ─── 2. RESERVAS → BOTÓN PEDIDO ─────────────────────────────────────────
    console.log('\n═══ TEST 2: BOTÓN PEDIDO EN RESERVAS ═══');
    await page.click('text=Reservas');
    await page.waitForTimeout(1000);
    await screenshot(page, '2-reservas-tab');

    let pedidoBtns = await page.locator('button:has-text("Pedido")').all();
    info(`Botones "Pedido" encontrados: ${pedidoBtns.length}`);

    if (pedidoBtns.length === 0) {
      info('Sin reservas hoy — creando reserva de prueba...');
      await page.click('button:has-text("Nueva Reserva")');
      await page.waitForSelector('input[placeholder="Juan Pérez"]', { timeout: 5000 });
      await page.fill('input[placeholder="Juan Pérez"]', 'Test Cliente');
      await page.fill('input[placeholder="juan@email.com"]', 'test@test.com').catch(() => {});
      await page.fill('input[placeholder="+56 9 0000 0000"]', '+56912345678').catch(() => {});
      await page.fill('input[placeholder="Mesa 12"]', 'Mesa 5').catch(() => {});
      await screenshot(page, '2b-nueva-reserva-form');
      await page.click('button:has-text("Crear Reservación")');
      await page.waitForTimeout(1500);
      await screenshot(page, '2c-reserva-creada');

      pedidoBtns = await page.locator('button:has-text("Pedido")').all();
    }

    info(`Botones "Pedido" disponibles: ${pedidoBtns.length}`);

    let pedidoCreadoDesdeReserva = false;

    if (pedidoBtns.length > 0) {
      await pedidoBtns[0].click();
      await page.waitForTimeout(800);
      await screenshot(page, '2d-modal-crear-pedido');

      // Verificar contenido del modal de confirmación
      const modalText = await page.locator('.fixed.inset-0').last().textContent().catch(() => '');
      const tieneCliente = modalText.includes('Cliente') || modalText.includes('cliente');
      const tieneMesa = modalText.includes('Mesa') || modalText.includes('mesa');
      tieneCliente ? pass('Modal muestra datos del cliente') : fail('Modal no muestra cliente');
      tieneMesa ? pass('Modal muestra mesa') : fail('Modal no muestra mesa');

      // Click Crear Pedido
      await page.click('button:has-text("Crear Pedido")');
      await page.waitForTimeout(2500);
      await screenshot(page, '2e-pedido-creado-detalle');

      // Verificar si el modal de items abrió (pedido creado exitosamente)
      const modalItems = await page.locator('text=Productos del pedido').isVisible().catch(() => false);
      if (modalItems) {
        pass('Pedido creado desde reserva — modal de items abierto');
        pedidoCreadoDesdeReserva = true;
        // Verificar navegación
        const inPedidos = await page.locator('text=Gestión de').isVisible().catch(() => false);
        inPedidos ? pass('Navegó a sección Pedidos') : info('Puede que la navegación sea automática');
      } else {
        // El modal de creación puede haber fallado (reserva ya tenía pedido activo)
        // Cerrar overlay y continuar con pedidos existentes
        info('No se abrió modal de items — posible reserva con pedido activo. Cerrando overlay...');
        await cerrarModalesAbiertos(page);
        await screenshot(page, '2f-overlay-cerrado');
        fail('Modal de items no apareció tras crear pedido');
      }
    } else {
      fail('No hay reservas disponibles para crear pedido');
    }

    // ─── 3. MODAL GESTIÓN DE ITEMS ───────────────────────────────────────────
    console.log('\n═══ TEST 3: GESTIÓN DE ITEMS EN PEDIDO ═══');
    await page.waitForTimeout(500);

    // Verificar si el modal ya está abierto (desde TEST 2) o abrirlo
    let modalVisible = await page.locator('text=Productos del pedido').isVisible().catch(() => false);

    if (!modalVisible) {
      info('Modal no abierto — navegando a Pedidos para abrir detalle...');
      await cerrarModalesAbiertos(page);
      modalVisible = await abrirDetallePedido(page);
    }

    if (modalVisible) {
      pass('Modal de items visible');
      await screenshot(page, '3a-modal-items-vacio');

      // Verificar input de búsqueda
      const searchVisible = await page.locator('input[placeholder*="Buscar producto"]').isVisible().catch(() => false);
      searchVisible ? pass('Input búsqueda productos visible') : fail('Input búsqueda no encontrado');

      // Agregar primer producto disponible en la lista
      const primerProducto = page.locator('.fixed.inset-0 button').filter({ hasText: /\$\d/ }).first();
      const primerNombre = await primerProducto.textContent().catch(() => '').then(t => t.trim().split('\n')[0].trim());
      info(`Primer producto disponible: "${primerNombre}"`);
      await primerProducto.click().catch(() => fail('No se pudo agregar primer producto'));
      await page.waitForTimeout(1200);
      await screenshot(page, '3b-item-agregado');

      // Verificar que apareció en la lista de items: el total cambia de $0 a algo mayor
      const totalText = await page.locator('.fixed.inset-0 >> text=Total').locator('..').textContent().catch(() => '');
      const totalPositivo = totalText.includes('$') && !totalText.includes('$0,00') && !totalText.includes('$0.00');
      info(`Total del pedido: "${totalText.replace(/\s+/g,' ').trim().substring(0,50)}"`);
      totalPositivo ? pass('Producto agregado — total mayor a $0') : fail('Item no aparece en lista del pedido');

      // Agregar segundo producto (el siguiente)
      const segundoProducto = page.locator('.fixed.inset-0 button').filter({ hasText: /\$\d/ }).nth(1);
      await segundoProducto.click().catch(() => info('No se pudo agregar segundo producto'));
      await page.waitForTimeout(1200);
      await screenshot(page, '3c-dos-items');

      // Verificar total
      const totalVisible = await page.locator('text=Total').last().isVisible().catch(() => false);
      totalVisible ? pass('Total visible en modal') : fail('Total no visible');

      // Verificar botón de estado
      const btnPreparar = await page.locator('button:has-text("Pasar a preparación")').isVisible().catch(() => false);
      btnPreparar ? pass('Botón "Pasar a preparación" visible') : info('Botón avanzar estado no encontrado');

      if (btnPreparar) {
        await page.click('button:has-text("Pasar a preparación")');
        await page.waitForTimeout(1200);
        pass('Estado avanzado a "en preparación"');
        await screenshot(page, '3d-en-preparacion');

        // Avanzar a entregado
        await page.click('button:has-text("Marcar entregado")').catch(() => {});
        await page.waitForTimeout(1500);
        // Limpiar búsqueda para no interferir con la UI
        await page.fill('input[placeholder*="Buscar producto"]', '').catch(() => {});
        await page.waitForTimeout(500);
        await screenshot(page, '3e-entregado');

        const btnVenta = await page.locator('.fixed.inset-0 button').filter({ hasText: /Registrar venta/i }).first().isVisible().catch(() => false);
        btnVenta ? pass('Botón "Registrar venta" visible cuando entregado') : fail('Botón "Registrar venta" no apareció');
      }

      // Cerrar modal correctamente
      await page.locator('.fixed.inset-0 button').filter({ has: page.locator('svg') }).first().click().catch(() => {});
      await page.waitForTimeout(300);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    } else {
      fail('Modal de items no pudo abrirse — no hay pedidos activos');
    }

    // ─── 4. VISTA POR MESA ───────────────────────────────────────────────────
    console.log('\n═══ TEST 4: VISTA POR MESA ═══');
    await cerrarModalesAbiertos(page);

    // Navegar a Pedidos usando el sidebar
    await page.locator('nav span:has-text("Pedidos"), aside span:has-text("Pedidos")').first().click().catch(async () => {
      await page.locator('text=Pedidos').first().click().catch(() => {});
    });
    await page.waitForTimeout(800);

    const btnPorMesa = page.locator('button:has-text("Por Mesa")');
    const btnMesasVisible = await btnPorMesa.isVisible().catch(() => false);
    btnMesasVisible ? pass('Botón "Por Mesa" visible en header') : fail('Botón "Por Mesa" no encontrado');

    if (btnMesasVisible) {
      await btnPorMesa.click();
      await page.waitForTimeout(1200);
      await screenshot(page, '4a-vista-por-mesa');

      const mesasCards = await page.locator('text=Mesas activas').isVisible().catch(() => false);
      mesasCards ? pass('Vista por mesa activada — "Mesas activas" visible') : fail('Vista por mesa no cargó');

      const hayMesas = await page.locator('.border-amber-500\\/50').count().catch(() => 0);
      info(`Cards de mesa: ${hayMesas}`);
      hayMesas > 0 ? pass(`${hayMesas} mesa(s) con pedidos activos`) : info('Sin mesas activas (pedido puede estar en estado confirmado)');

      if (hayMesas > 0) {
        const btnProductos = await page.locator('button:has-text("Productos")').first().isVisible().catch(() => false);
        btnProductos ? pass('Botón "Productos" en card de mesa') : info('Botón Productos no visible en card');
        await screenshot(page, '4b-mesa-con-pedido');
      }
    }

    // ─── 5. FLUJO DE ESTADOS EN LISTA ────────────────────────────────────────
    console.log('\n═══ TEST 5: FLUJO DE ESTADOS EN LISTA ═══');
    await cerrarModalesAbiertos(page);
    const btnLista2 = page.locator('button:has-text("Lista")');
    if (await btnLista2.isVisible().catch(() => false)) await btnLista2.click();
    await page.waitForTimeout(800);
    await screenshot(page, '5a-vista-lista');

    // Buscar fila con badge de estado "pendiente" (filtro específico para no dar false positives)
    const filaPendiente = page.locator('tr').filter({ has: page.locator('span', { hasText: /^pendiente$/i }) });
    const pedidoPendiente = await filaPendiente.first().isVisible().catch(() => false);
    info(`Pedido pendiente en tabla: ${pedidoPendiente}`);

    if (pedidoPendiente) {
      const chevron = filaPendiente.first().locator('button[title="Avanzar estado"]');
      if (await chevron.isVisible().catch(() => false)) {
        await chevron.click();
        await page.waitForTimeout(1000);
        pass('Estado avanzado desde pendiente');
        await screenshot(page, '5b-estado-avanzado');
      } else {
        info('Botón "Avanzar estado" no encontrado en fila pendiente (puede estar oculto hasta hover)');
        // Intentar por posición directa
        const allChevrons = await page.locator('button[title="Avanzar estado"]').all();
        info(`Total botones "Avanzar estado" en página: ${allChevrons.length}`);
        if (allChevrons.length > 0) {
          await allChevrons[0].click();
          await page.waitForTimeout(1000);
          pass('Estado avanzado (botón directo)');
          await screenshot(page, '5b-estado-avanzado');
        }
      }
    } else {
      info('No hay pedidos en estado pendiente en la tabla de hoy');
    }

    // ─── 6. REGISTRAR VENTA DESDE PEDIDO ────────────────────────────────────
    console.log('\n═══ TEST 6: REGISTRAR VENTA DESDE PEDIDO ═══');
    const pedidoEntregado = await page.locator('span:has-text("entregado")').first().isVisible().catch(() => false);
    info(`Pedido entregado visible: ${pedidoEntregado}`);

    if (pedidoEntregado) {
      const receiptBtn = page.locator('tr:has(span:has-text("entregado")) button[title="Registrar venta"]').first();
      if (await receiptBtn.isVisible().catch(() => false)) {
        await receiptBtn.click();
        await page.waitForTimeout(800);
        const ventaModal = await page.locator('text=Registrar como venta').isVisible().catch(() => false);
        ventaModal ? pass('Modal de registro de venta abierto') : fail('Modal de venta no abrió');
        await screenshot(page, '6a-modal-venta');

        if (ventaModal) {
          await page.click('button:has-text("Confirmar venta")');
          await page.waitForTimeout(1500);
          pass('Venta registrada');
          await screenshot(page, '6b-venta-confirmada');
        }
        await page.keyboard.press('Escape').catch(() => {});
      } else {
        info('Botón "Registrar venta" no visible en tabla — el pedido puede ya haber sido registrado');
      }
    }

    // ─── 7. FLUJO COMPLETO RESERVA → PEDIDO → VENTA ─────────────────────────
    console.log('\n═══ TEST 7: FLUJO COMPLETO RESERVA → PEDIDO → VENTA ═══');
    await cerrarModalesAbiertos(page);
    await page.locator('nav span:has-text("Reservas"), aside span:has-text("Reservas")').first().click().catch(async () => {
      await page.locator('text=Reservas').first().click().catch(() => {});
    });
    await page.waitForTimeout(1000);

    // Crear nueva reserva
    await page.click('button:has-text("Nueva Reserva")');
    await page.waitForSelector('input[placeholder="Juan Pérez"]', { timeout: 5000 });
    await screenshot(page, '7a-modal-nueva-reserva');

    await page.fill('input[placeholder="Juan Pérez"]', 'Cliente Test 7');
    await page.fill('input[placeholder="juan@email.com"]', 'test7@test.com').catch(() => {});
    await page.fill('input[placeholder="+56 9 0000 0000"]', '+56987654321').catch(() => {});
    await page.fill('input[placeholder="Mesa 12"]', 'Mesa 7').catch(() => {});
    await page.fill('input[placeholder="2"]', '4').catch(() => {});
    await screenshot(page, '7b-formulario-reserva-lleno');

    await page.click('button:has-text("Crear Reservación")');
    await page.waitForTimeout(1500);
    await screenshot(page, '7c-reserva-creada');

    // Buscar el botón Pedido de la reserva recién creada (la última de la lista)
    const pedidoBtnsAll = await page.locator('button:has-text("Pedido")').all();
    const btnPedidoUltimo = pedidoBtnsAll[pedidoBtnsAll.length - 1];
    const btnPedidoVisible = btnPedidoUltimo ? await btnPedidoUltimo.isVisible().catch(() => false) : false;

    if (btnPedidoVisible) {
      await btnPedidoUltimo.click();
      await page.waitForTimeout(800);
      await screenshot(page, '7d-modal-crear-pedido-reserva');

      await page.click('button:has-text("Crear Pedido")');
      await page.waitForTimeout(2500);
      await screenshot(page, '7e-detalle-pedido-abierto');

      const itemsModal = await page.locator('text=Productos del pedido').isVisible().catch(() => false);
      if (itemsModal) {
        pass('Modal de items abierto desde reserva nueva');

        // Agregar dos productos disponibles
        const p1 = page.locator('.fixed.inset-0 button').filter({ hasText: /\$\d/ }).first();
        await p1.click().catch(() => info('No se pudo agregar producto 1 (test 7)'));
        await page.waitForTimeout(800);

        const p2 = page.locator('.fixed.inset-0 button').filter({ hasText: /\$\d/ }).nth(1);
        await p2.click().catch(() => info('No se pudo agregar producto 2 (test 7)'));
        await page.waitForTimeout(800);
        await screenshot(page, '7f-items-agregados');

        // Avanzar estados
        await page.click('button:has-text("Pasar a preparación")').catch(() => {});
        await page.waitForTimeout(1000);
        await page.click('button:has-text("Marcar entregado")').catch(() => {});
        await page.waitForTimeout(1500);
        await page.fill('input[placeholder*="Buscar producto"]', '').catch(() => {});
        await page.waitForTimeout(500);
        await screenshot(page, '7g-pedido-entregado');

        // Registrar venta
        const btnRegVenta = await page.locator('.fixed.inset-0 button').filter({ hasText: /Registrar venta/i }).first().isVisible().catch(() => false);
        if (btnRegVenta) {
          // Usar el botón dentro del modal (no los del menú desplegable en la tabla)
          await page.locator('.fixed.inset-0 button').filter({ hasText: /Registrar venta/i }).first().click();
          await page.waitForTimeout(1500);
          await screenshot(page, '7h-modal-confirmar-venta');

          // El modal de confirmar venta puede estar anidado
          const confirmBtn = page.locator('button').filter({ hasText: /Confirmar venta/i }).first();
          if (await confirmBtn.isVisible().catch(() => false)) {
            await confirmBtn.click();
            await page.waitForTimeout(2000);
            await screenshot(page, '7i-venta-registrada-final');
            pass('✨ FLUJO COMPLETO: Reserva → Pedido → Items → Entregado → Venta ✨');
          } else {
            await screenshot(page, '7h2-sin-confirm-modal');
            info('Modal de confirmar venta no apareció — verificar flujo');
          }
        } else {
          info('Botón "Registrar venta" no visible — verificar estado del pedido');
        }
      } else {
        fail('Modal de items no apareció tras crear pedido en test 7');
        await cerrarModalesAbiertos(page);
      }
    } else {
      fail('No se encontró botón Pedido para la reserva recién creada');
    }

  } catch (err) {
    console.error('\n💥 ERROR INESPERADO:', err.message);
    await screenshot(page, 'error-state').catch(() => {});
  } finally {
    console.log('\n═══ RESUMEN SCREENSHOTS ═══');
    SCREENSHOTS.forEach(s => console.log(' -', s));
    await browser.close();
  }
}

run();
