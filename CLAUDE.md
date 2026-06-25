## Stack

**Frontend**
- React 18, Vite 5, Tailwind CSS 4
- Recharts (gráficos), Framer Motion (animaciones)
- socket.io-client 4 (tiempo real), jsPDF, xlsx
- Vitest + Testing Library (unit), Playwright (e2e)

**Backend**
- Node.js, Express 4, Prisma 5 (ORM), PostgreSQL
- Socket.io 4 + Redis Adapter (multi-instancia, opcional)
- JWT (access 15 min + refresh 7 días), bcryptjs
- Stripe (subscriptions, webhooks, billing portal)
- Resend (alertas de stock por email, vía API)
- Cloudflare R2 compatible con AWS S3 (upload logos)
- Pino (logging estructurado), Helmet, express-rate-limit
- Jest + Supertest (tests backend)

**Deploy**
- Railway (railway.json configurado), Docker (Dockerfile en raíz y en server/)
- Swagger/OpenAPI en `/api/docs`

---

## Estructura de carpetas

```
├── src/                        # Frontend React (ESM, type: "module")
│   ├── pages/                  # Una página por vista del dashboard
│   │   ├── DashboardPage.jsx   # KPIs y resumen general
│   │   ├── PedidosPage.jsx     # Gestión de pedidos y vista por mesas
│   │   ├── VentasPage.jsx      # Historial de ventas y tickets
│   │   ├── ReservasPage.jsx    # Reservas con consumos inline
│   │   ├── ClientesPage.jsx    # CRM básico de clientes
│   │   ├── InventarioPage.jsx  # Stock y movimientos
│   │   ├── AnalyticsPage.jsx   # Métricas avanzadas (plan pro+)
│   │   └── Billing.jsx         # Planes, uso y Stripe checkout
│   ├── components/
│   │   ├── ui/                 # Componentes atómicos reutilizables
│   │   ├── layout/             # SidebarItem y estructura de nav
│   │   ├── notifications/      # ToastContainer
│   │   └── UsageBanner.jsx     # Banner de límite de plan (free)
│   ├── lib/
│   │   └── pedidoQtyUtils.js   # Lógica de cálculo de cantidades
│   ├── App.jsx                 # Router principal + WebSocket init
│   ├── AuthContext.jsx         # Auth global: tokens, refresh, logout
│   ├── api.js                  # Cliente HTTP con interceptor JWT
│   └── LoginScreen.jsx         # Pantalla de login/signup
│
├── server/                     # Backend Node/Express (CommonJS)
│   ├── routes/                 # Un archivo por recurso
│   │   ├── auth.js             # login, refresh, logout, signup, register, me
│   │   ├── pedidos.js          # CRUD pedidos + items + estado (con stock)
│   │   ├── ventas.js           # CRUD ventas + tickets
│   │   ├── reservas.js         # CRUD reservas + consumos
│   │   ├── clientes.js         # CRM clientes
│   │   ├── productos.js        # Catálogo + upload imagen
│   │   ├── categorias.js       # Categorías de productos
│   │   ├── usuarios.js         # Gestión de usuarios del restaurante
│   │   ├── caja.js             # Apertura/cierre de caja
│   │   ├── config.js           # ConfigNegocio + upload logo a R2
│   │   ├── inventario.js       # Movimientos de inventario
│   │   ├── analytics.js        # Métricas avanzadas (requiere plan pro+)
│   │   └── billing.js          # Stripe checkout, webhook, portal, usage
│   ├── middleware/
│   │   ├── auth.js             # Verifica JWT, pone req.user
│   │   ├── verifyRole.js       # Restricción por rol
│   │   ├── verifyAdminCode.js  # Pin de seguridad para acciones destructivas
│   │   ├── requireTenant.js    # Bloquea si req.user.restaurante_id falta
│   │   ├── checkPlanLimit.js   # checkOrderLimit, checkUserLimit, incrementarOrden
│   │   └── apiKeyAuth.js       # Auth por API Key (plan business)
│   ├── lib/
│   │   ├── prisma.js           # Singleton PrismaClient
│   │   ├── socket.js           # Socket.io: init, emit por sala, bloqueo por plan
│   │   ├── planLimits.js       # PLAN_LIMITS, checkPlanFeature middleware
│   │   ├── validateEnv.js      # Valida env vars al arrancar (falla si falta required)
│   │   ├── ventaHelper.js      # createVentaConTicket (lógica de numeración)
│   │   ├── mailer.js           # sendStockAlert vía Resend
│   │   ├── r2.js               # Upload a Cloudflare R2
│   │   ├── logger.js           # Pino logger
│   │   ├── dateUtils.js        # toDate, fromFilter para queries por fecha
│   │   └── cache.js            # Cache en memoria (TTL corto)
│   ├── prisma/
│   │   ├── schema.prisma       # Fuente de verdad del modelo de datos
│   │   └── migrations/         # Historial de migraciones SQL
│   ├── tests/                  # Jest + Supertest
│   ├── docs/openapi.json       # Spec OpenAPI servido en /api/docs
│   ├── scripts/                # Migraciones manuales y utilidades
│   ├── app.js                  # Express: middlewares, rutas, raw body Stripe
│   └── index.js                # Entry point: HTTP server + Socket.io
│
├── e2e/                        # Tests Playwright (login, pedidos)
├── docs/                       # Documentación interna del proyecto
├── dist/                       # Build Vite (generado, no editar)
└── coverage/                   # Reporte de cobertura (generado, no editar)
```

---

## Comandos esenciales

```bash
# Instalar dependencias (siempre ambos)
npm install
cd server && npm install

# Desarrollo completo (frontend + backend en paralelo)
npm run dev:full

# Solo frontend (puerto 5173)
npm run dev

# Solo backend (puerto 9000, con nodemon)
npm run server:dev

# Tests frontend (Vitest)
npm test

# Tests frontend con watch
npm run test:watch

# Tests backend (Jest + Supertest)
npm run test:backend

# Tests E2E (Playwright)
npm run test:e2e

# Build producción
npm run build

# Prisma — SIEMPRE ejecutar desde server/, nunca desde la raíz
cd server

# Aplicar cambios de schema.prisma a la BD (crea migración SQL)
npx prisma migrate dev --name descripcion_del_cambio

# Aplicar migraciones en producción (sin generar archivos de migración)
npx prisma migrate deploy

# Regenerar cliente tras cualquier cambio al schema
npx prisma generate

# Explorar y editar datos en UI (puerto 5555)
npx prisma studio

# Primera vez / desarrollo inicial sin historial de migraciones
npx prisma db push

# Errores comunes en Windows
# EPERM rename        → cerrar Prisma Studio si está abierto antes de migrar
# schema not found    → verificar que estás en server/, no en la raíz del repo
# P1001 can't connect → verificar que PostgreSQL está corriendo (services.msc)
```

---

## Reglas del proyecto (NO hacer)

- **No crear archivos fuera de `server/` o `src/`** sin preguntar primero
- **No ejecutar comandos destructivos** (`DROP TABLE`, `prisma migrate reset`, `delete` masivo en DB) sin confirmación explícita
- **No modificar `server/prisma/schema.prisma`** sin mostrar el diff completo primero y esperar aprobación
- **No tocar archivos de configuración** (`vite.config.js`, `eslint.config.js`, `playwright.config.js`, `jest.config.js`) sin avisar
- **No instalar dependencias nuevas** sin listar el paquete, versión y motivo antes de hacer `npm install`
- **No hacer `git push` ni crear PRs** sin confirmación explícita
- **No modificar migraciones ya aplicadas** en `server/prisma/migrations/` — siempre crear una nueva

---

## Variables de entorno requeridas

El servidor valida estas variables al arrancar (`server/lib/validateEnv.js`). Las obligatorias causan `process.exit(1)` si faltan.

### Obligatorias — `server/.env`

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname` |
| `JWT_SECRET` | Cadena aleatoria >= 32 chars |

### Opcionales — `server/.env`

| Variable | Descripción | Usado en |
|---|---|---|
| `FRONTEND_URL` | URL del frontend (ej: `https://app.tudominio.com`) | CORS, redirect Stripe |
| `REDIS_URL` | `redis://` o `rediss://` | Socket.io multi-instancia |
| `STRIPE_SECRET_KEY` | `sk_live_...` o `sk_test_...` | Billing |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Validar firma de webhooks |
| `STRIPE_PRICE_PRO` | `price_...` ID del precio Pro en Stripe | Checkout |
| `STRIPE_PRICE_BUSINESS` | `price_...` ID del precio Business en Stripe | Checkout |
| `RESEND_API_KEY` | API key de Resend (`re_...`) — envía desde `hola@mastexopos.com` | Alertas de stock |
| `ALERT_EMAIL` | Email destino para alertas de stock bajo | Alertas de stock |
| `R2_ACCOUNT_ID` | Cloudflare account ID | Upload logos |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key | Upload logos |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret | Upload logos |
| `R2_BUCKET` | Nombre del bucket R2 | Upload logos |
| `R2_PUBLIC_URL` | URL pública del bucket (custom domain) | URLs de logos |

### Config de JWT — valores por defecto en `server/config.js`

| Variable | Default | Descripción |
|---|---|---|
| `JWT_EXPIRES` | `15m` | Duración del access token |
| `JWT_REFRESH_EXPIRES` | `7d` | Duración del refresh token |
| `PORT` | `9000` | Puerto del servidor |

### `.env` mínimo para desarrollo local (copiar en `server/.env`)

```env
# PostgreSQL local Windows — con contraseña
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/dashboard_restaurante"

# PostgreSQL local Windows — sin contraseña
# DATABASE_URL="postgresql://postgres@localhost:5432/dashboard_restaurante"

# Generar JWT_SECRET con:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET="pegar-aqui-el-output-del-comando-de-arriba"

# Stripe test (obtener en dashboard.stripe.com → Developers → API keys)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_PRO="price_..."
STRIPE_PRICE_BUSINESS="price_..."

FRONTEND_URL="http://localhost:5173"
PORT=9000
```

---

## Contexto de negocio

SaaS de gestión para restaurantes. Cada restaurante es un tenant aislado por `restaurante_id`. El campo `plan` en el modelo `Restaurante` controla los límites.

### Planes

| Feature | Free | Pro ($29/mes) | Business ($79/mes) |
|---|---|---|---|
| Órdenes/mes | 50 | Ilimitadas | Ilimitadas |
| Usuarios | 2 | Ilimitados | Ilimitados |
| Locales | 1 | 1 | 5 |
| WebSocket tiempo real | No | Sí | Sí |
| Analytics avanzado | No | Sí | Sí |
| Alertas email stock | No | Sí | Sí |
| PDF de tickets | No | Sí | Sí |
| API Keys | No | No | Sí |
| Multi-local | No | No | Sí |

### Aislamiento multi-tenant

- Toda query filtra por `restaurante_id` — el middleware `requireTenant` lo garantiza
- El JWT payload incluye `restaurante_id` y `rol`
- Los límites de plan se aplican en middleware (`checkOrderLimit`, `checkUserLimit`, `checkPlanFeature`)
- WebSocket: cada restaurante tiene sala propia `rest_{id}`, sub-salas por rol (`rest_{id}:cocina`, etc.)

---

## Estado actual del proyecto

### Implementado y funcionando

- **Auth completa**: signup público (crea restaurante + admin en transacción), login, refresh token, logout, change-password, rate limiting
- **CRUD completo**: pedidos (con items, control de stock atómico, inventario), ventas, reservas (con consumos), clientes, productos, categorías, usuarios, caja, configuración del negocio, inventario/movimientos
- **Plan limits**: `checkOrderLimit` en POST /pedidos, `checkUserLimit` en POST /usuarios, `checkPlanFeature` en analytics
- **WebSocket**: Socket.io con salas por restaurante y rol; conexión bloqueada para plan free con evento `plan_upgrade_required`
- **Billing Stripe**: checkout session, webhook (completed, payment_succeeded, subscription deleted/updated), billing portal, endpoint `/api/billing/usage`; metadata propagada a la suscripción correctamente
- **API Keys**: modelo en schema + middleware `apiKeyAuth` (plan business)
- **Alertas de stock**: por email vía Resend al cruzar stock mínimo
- **Upload logos**: a Cloudflare R2 desde `/api/config`
- **OpenAPI docs**: en `/api/docs`
- **Tests**: unit frontend (Vitest), unit backend (Jest+Supertest), e2e básico (Playwright)
- **Deploy**: Railway con `railway.json`, Docker

### Pendiente / incompleto

- **`src/pages/Billing.jsx`**: archivo creado, falta conectar botones con los endpoints de billing
- **`src/components/UsageBanner.jsx`**: componente creado, falta integrarlo en el layout de `App.jsx`
- **Multi-local**: campo `locales_count` en schema y `multi_local` en plan limits, sin UI ni lógica de negocio
- **API Keys UI**: middleware listo pero no hay pantalla para crear/revocar keys desde el dashboard
- **Analytics**: solo `/api/analytics/ventas` implementado; faltan métricas por producto, por hora, comparativas
- **RLS en Supabase**: `server/rls-setup.sql` existe pero no está aplicado en producción
- **PDF de tickets**: jsPDF instalado en frontend, feature flag en plan limits, sin implementar

---

## Protocolo de sesión

### Al INICIAR una sesión de código

Pega siempre esto al principio:

> Sesión de código — Dashboard Restaurante.
> Objetivo de hoy: [UNA cosa específica].
> No estrategia, no planificación, solo código.
> Lee el CLAUDE.md antes de hacer cualquier cambio.

### Al TERMINAR una sesión

Pide siempre esto al final:

> Resume en 3 líneas:
> 1. Qué quedó funcionando
> 2. Qué quedó pendiente
> 3. El próximo comando exacto para continuar

Guardar esa respuesta en `NOTAS_SESION.md` en la raíz del repo.

### Regla de oro

Una sesión = un objetivo.
Si surge una idea de negocio o estrategia → anotarla en `IDEAS.md` y continuar.
Las sesiones de planificación van los lunes por la mañana, separadas del código.

---

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. The
skill has multi-step workflows, checklists, and quality gates that produce better
results than an ad-hoc answer. When in doubt, invoke the skill. A false positive is
cheaper than a false negative.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke /office-hours
- Strategy, scope, "think bigger", "what should we build" → invoke /plan-ceo-review
- Architecture, "does this design make sense" → invoke /plan-eng-review
- Design system, brand, "how should this look" → invoke /design-consultation
- Design review of a plan → invoke /plan-design-review
- Developer experience of a plan → invoke /plan-devex-review
- "Review everything", full review pipeline → invoke /autoplan
- Bugs, errors, "why is this broken", "wtf", "this doesn't work" → invoke /investigate
- Test the site, find bugs, "does this work" → invoke /qa (or /qa-only for report only)
- Code review, check the diff, "look at my changes" → invoke /review
- Visual polish, design audit, "this looks off" → invoke /design-review
- Developer experience audit, try onboarding → invoke /devex-review
- Ship, deploy, create a PR, "send it" → invoke /ship
- Merge + deploy + verify → invoke /land-and-deploy
- Configure deployment → invoke /setup-deploy
- Post-deploy monitoring → invoke /canary
- Update docs after shipping → invoke /document-release
- Weekly retro, "how'd we do" → invoke /retro
- Second opinion, codex review → invoke /codex
- Safety mode, careful mode, lock it down → invoke /careful or /guard
- Restrict edits to a directory → invoke /freeze or /unfreeze
- Upgrade gstack → invoke /gstack-upgrade
- Save progress, "save my work" → invoke /context-save
- Resume, restore, "where was I" → invoke /context-restore
- Security audit, OWASP, "is this secure" → invoke /cso
- Make a PDF, document, publication → invoke /make-pdf
- Launch real browser for QA → invoke /open-gstack-browser
- Import cookies for authenticated testing → invoke /setup-browser-cookies
- Performance regression, page speed, benchmarks → invoke /benchmark
- Review what gstack has learned → invoke /learn
- Tune question sensitivity → invoke /plan-tune
- Code quality dashboard → invoke /health

---

## Project Learnings

Patrones, trampas y decisiones de arquitectura capturadas automáticamente por gstack.
Última actualización: 2026-05-14.

### Patterns

- **cult-ui-effects-pattern**: Cult UI effects (BorderBeam, ShineBorder, Ripple, DotPattern, RetroGrid) se instalan manualmente en `src/components/ui/` — no hay paquete npm. Cada uno necesita su `@keyframes` en `index.css`. `motion/react` no existe: usar `framer-motion` directamente. (confianza: 10/10)
  > Archivos: `src/components/ui/border-beam.jsx`, `shine-border.jsx`, `ripple.jsx`, `dot-pattern.jsx`, `retro-grid.jsx`, `src/index.css`

### Pitfalls

- **mesa-ocupada-post-venta**: Nunca mostrar una mesa como ocupada después de que la venta fue cobrada. Al completar una venta: cerrar el pedido (`estado=CERRADO`), liberar la mesa (`estado=LIBRE`), y conservar el historial en ventas. Si uno falla el mozo ve la mesa ocupada con la venta ya cobrada. (confianza: 9/10)
  > Archivos: `src/pages/PedidosPage.jsx`, `server/routes/pedidos.js`, `server/routes/ventas.js`

- **plan-gate-silent-zeros**: Cuando `checkPlanFeature` retorna 403, `api.js` lanza y el error se traga silenciosamente, mostrando ceros que parecen datos reales. Fix: listener `upgrade_required` en `App.jsx` + estado locked en la página del feature. (confianza: 9/10)
  > Archivos: `src/pages/AnalyticsPage.jsx`, `src/App.jsx`, `server/lib/planLimits.js`, `src/api.js`

- **ventas-3-query-invalidation**: `venta:realizada` por socket debe invalidar **tres** queries separadas: `ventasDia`, `ventasResumen-by-period`, `ventasResumen-dia`. Un solo `queryKey.ventas` no alcanza. El factory de queryKeys debe exponer las tres claves más un helper `invalidateAll`. (confianza: 9/10)
  > Archivos: `src/App.jsx`

- **reservas-selectedDate-filter**: `addReservation` optimista agrega a `reservas[]` pero `dailyReservations` filtra por `selectedDate`. Si el calendario está en otra fecha, la reserva nueva es invisible. Fix: `setSelectedDate(normalized.fecha)` después de la creación. (confianza: 9/10)
  > Archivos: `src/App.jsx`, `src/pages/ReservasPage.jsx`

- **prisma-interactive-tx-utf8-null-byte**: Mover `pedido.create()` dentro de un `$transaction` interactivo en Prisma 5.x + PostgreSQL puede lanzar error `22021` (null byte) en tests. Los tests de `pedidos.test.js` ya fallaban en la codebase original — no es regresión. (confianza: 8/10)
  > Archivos: `server/routes/pedidos.js`, `server/tests/unit/pedidos.test.js`

### Architecture

- **tanstack-query-god-component-path**: Cuando `App.jsx` es un God Component (3000+ líneas), la integración correcta de TanStack Query es: queries en `App.jsx` primero (beneficio inmediato, diff mínimo), luego refactor de páginas en sesión separada. Hacerlo simultáneo es alto riesgo. (confianza: 9/10)
  > Archivos: `src/App.jsx`, `src/api.js`

### Operational

- **railway-port-healthcheck**: Railway inyecta `PORT` dinámicamente. `EXPOSE` y `HEALTHCHECK` deben usar `${PORT:-3000}`, no `9000` hardcodeado. `start-period` mínimo 60s. `validateEnv()` con `process.exit(1)` puede matar el servidor antes del healthcheck si las env vars no están en el dashboard de Railway. (confianza: 9/10)
  > Archivos: `Dockerfile`, `server/Dockerfile`, `server/config.js`, `server/lib/validateEnv.js`
Correcciones de seguridad y arquitectura en curso

Análisis completado por revisión externa. Atacar en orden — no saltar puntos.

⚠️ Punto 1 — RLS + transacciones (el doc decía COMPLETADO, pero no lo estaba del todo)


server/lib/prisma.js: set_config corre dentro de cada operación vía la extensión $allOperations, no en transacción paralela — esto sí está.
Corregido 2026-06-23: este punto decía "se exporta withTenant(req, fn) para transacciones con callback" — **eso nunca existió en el código**. El patrón real en cada ruta sigue siendo req.prisma.$transaction(async (tx) => {...}, { timeout }) con restaurante_id agregado a mano en cada query de tx (porque tx no hereda la extensión multi-tenant — ver nota en server/lib/prisma.js). No hay ningún withTenant que reemplazar.
Corregido 2026-06-23: "FK reales en AuditLog" tampoco era cierto — AuditLog no tenía @relation a Restaurante, y la tabla ni existía en la BD real hasta hoy (ver sección de verificación end-to-end más abajo).
rls-setup.sql sí tiene VentaItem y AuditLog en la lista de tablas protegidas, pero NO tiene FORCE ROW LEVEL SECURITY en ninguna tabla — solo ENABLE ROW LEVEL SECURITY. Pendiente real: decidir si hace falta FORCE (afecta incluso al owner de la tabla) y aplicarlo si corresponde.


✅ Punto 2 — Quitar @default(1) (COMPLETADO EN SCHEMA)


Eliminado @default(1) de restaurante_id en todos los modelos.
Migración SQL pendiente de aplicar en Supabase: ALTER TABLE ... ALTER COLUMN restaurante_id DROP DEFAULT.


✅ Punto 3 — AuditLog sin FK (RESUELTO en Punto 1)

⏳ Punto 4 — Producto.categoria es String libre sin FK a Categoria


Problema: renombrar una categoría deja productos con nombre viejo — la BD no puede evitarlo.
Solución: agregar categoria_id Int? con FK a Categoria, migrar datos, deprecar el campo categoria string.
Archivos a tocar: server/prisma/schema.prisma, nueva migración, server/routes/productos.js.


✅ Punto 5 — ticket_id: cuello de botella serializado (COMPLETADO)


server/prisma/schema.prisma: nuevo modelo TicketSecuencia (restaurante_id, fecha, ultimo_numero, @@unique([restaurante_id, fecha])) + relación en Restaurante.
server/prisma/migrations/20260623000000_add_ticket_secuencia/migration.sql: CREATE TABLE + función next_ticket_numero(rid, fecha, inicial) con INSERT ... ON CONFLICT DO UPDATE RETURNING ultimo_numero. Aplicada manualmente en Supabase vía SQL Editor (este entorno no tenía salida de red hacia la DB); registro insertado a mano en `_prisma_migrations` para que coincida con el historial de Prisma.
server/lib/ventaHelper.js: reemplazado el findFirst + create con hasta 8 reintentos por una sola llamada SELECT next_ticket_numero(...) dentro de $transaction — atómico sin retries ni locks en el lado de la app.
TicketSecuencia agregado a TENANT_MODELS en server/lib/prisma.js y a rls-setup.sql.


✅ Punto 6 — Float → Decimal en campos monetarios (COMPLETADO)


server/prisma/schema.prisma: Float → Decimal @db.Decimal(12,2) en Cliente.total_gastado, Producto.precio, Pedido.total, PedidoItem.precio_unitario, Reserva.consumo_base, ReservaConsumo.precio_unitario, Venta.subtotal, Venta.total, VentaItem.precio_unitario, Caja.monto_inicial/monto_final/total_ventas/total_efectivo/diferencia, ConfigNegocio.tax_rate.
server/prisma/migrations/20260623010000_float_to_decimal_monetary/migration.sql: ALTER COLUMN ... TYPE DECIMAL(12,2) USING ...::numeric(12,2) para cada campo. Aplicada manualmente en Supabase vía SQL Editor (sin salida de red a la DB desde este entorno); registro insertado a mano en `_prisma_migrations`.
Riesgo real (no el que dice el punto original): Decimal de Prisma (decimal.js) NO castea implícito a number — `valueOf`/`toJSON` devuelven string, así que `0 + decimal` concatena strings y `JSON.stringify`/`res.json()` serializa `"19.99"` como string, no número. `*`, `/`, comparaciones y `.toFixed()` sí funcionan bien porque fuerzan conversión numérica.
Fix centralizado en server/lib/prisma.js: se parchea `Decimal.prototype.valueOf` y `.toJSON` una sola vez (`Number(this.toString())`) antes de instanciar PrismaClient. Aplica a toda instancia de Decimal en el proceso — incluida la generada dentro de `$transaction(async tx => {...})`, que NO hereda la extensión `$allOperations` de prisma.js (ver nota arriba de Punto 1). Cero cambios en routes/ ni en frontend: las respuestas JSON siguen llegando como `number` igual que con Float.
Verificado con node -e: `1 + Decimal('123.45')` → `124.45` (no string), `JSON.stringify({d})` → `{"d":123.45}` (number), `toFixed(2)` sigue funcionando.


✅ Punto 7 — Pedido.numero y Venta.ticket_id son @unique globales (COMPLETADO)


server/prisma/schema.prisma: quitado @unique de Pedido.numero y Venta.ticket_id; agregado @@unique([numero, restaurante_id]) en Pedido y @@unique([ticket_id, restaurante_id]) en Venta.
server/prisma/migrations/20260623020000_scope_numero_ticket_id_to_tenant/migration.sql: DROP INDEX de los unique antiguos (Pedido_numero_key, Venta_ticket_id_key) + CREATE UNIQUE INDEX compuesto. Pendiente aplicar en Supabase (mismo flujo manual de los puntos 5 y 6: pegar en SQL Editor + registrar en `_prisma_migrations`).
Verificado: ningún route hace findUnique/upsert por numero o ticket_id solos (solo lectura/auditoría) — el cambio no rompe ningún lookup existente.


✅ Punto 8 — Sin onDelete explícito en relaciones hacia Restaurante (COMPLETADO)


server/prisma/schema.prisma: las 16 relaciones hacia Restaurante (ApiKey, Usuario, Cliente, Categoria, Producto, Pedido, PedidoItem, Reserva, ReservaConsumo, Venta, TicketSecuencia, VentaItem, Caja, ConfigNegocio, Proveedor, InventarioMovimiento) ahora declaran onDelete: Cascade explícito — antes usaban el default implícito (RESTRICT), que es justo lo que bloqueaba dar de baja un tenant.
server/prisma/migrations/20260623030000_cascade_delete_restaurante/migration.sql: DROP CONSTRAINT + ADD CONSTRAINT ... ON DELETE CASCADE en cada FK. Pendiente aplicar en Supabase (mismo flujo manual de los puntos 5-7).
Nota: no existe todavía un endpoint que borre un Restaurante — este punto es preparación de schema, no agrega la ruta de offboarding.
Hallazgo aparte (no corregido, fuera de alcance de hoy): AuditLog.restaurante_id sigue siendo un Int suelto sin @relation a Restaurante — el Punto 1 lo marca como COMPLETADO pero el schema no lo refleja. Revisar en una sesión futura.


❌ Punto 9 — Índices de analytics faltantes (COMPLETADO)


Ya agregados en migración del Punto 1: PedidoItem(restaurante_id, producto_id) y VentaItem(restaurante_id, producto_id).


✅ Punto 10 — Enums como String y payment_methods como JSON en string (COMPLETADO)


server/prisma/schema.prisma: ConfigNegocio.payment_methods cambiado de String a Json.
server/routes/config.js: quitado JSON.parse/JSON.stringify manual sobre payment_methods (ya no hace falta con Json nativo) — eliminada la función parseRow que solo hacía ese parse.
server/prisma/migrations/20260623040000_json_payment_methods_and_enum_checks/migration.sql: ALTER COLUMN payment_methods a JSONB (cast directo, el texto guardado ya era JSON válido) + 9 CHECK constraints con NOT VALID (Cliente.estado, Cliente.tipo_cliente, Usuario.rol, Pedido.estado, Pedido.metodo_pago, Venta.metodo_pago, Reserva.estado, Caja.estado, Restaurante.plan_status). Pendiente aplicar en Supabase (mismo flujo manual de los puntos 5-8) — antes de correr los VALIDATE CONSTRAINT que quedan comentados al final del archivo, revisar con los SELECT DISTINCT incluidos que no haya filas legadas fuera de rango.
Confirmado: Prisma 5.22 no soporta @@check en schema.prisma (error "Attribute not known: @check") — el constraint vive solo en la BD, no en schema.prisma.
'super_admin' (rol de Usuario, usado en middleware/verifyRole.js pero nunca asignado por ninguna ruta) se incluyó en el CHECK para no romper esa funcionalidad si algún día se usa.

✅ Verificación end-to-end de los 10 puntos contra la BD real (COMPLETADO — 2026-06-23)


Se levantó el servidor local y se confirmó que DATABASE_URL (pooler, puerto 6543) SÍ es alcanzable desde este entorno para queries normales — solo `prisma migrate`/`DIRECT_URL` (puerto 5432, host directo) está bloqueado. Esto permitió probar todo contra Supabase real y aplicar fixes directos con `$executeRawUnsafe` + INSERT manual en `_prisma_migrations`.

Verificado funcionando end-to-end (signup → login → crear pedido → confirmar pedido → venta con ticket_id → caja → clientes):
- Punto 5: ticket_id atómico, ej. "TKT-20260623-000001".
- Punto 6: montos llegan como number plano (19.98, 100, 0), no Decimal/string.
- Punto 7: confirmado en BD `Pedido_numero_restaurante_id_key` y `Venta_ticket_id_restaurante_id_key`.
- Punto 8: confirmado en BD las 15 FK existentes en CASCADE; probado en vivo — un DELETE de Restaurante limpió usuarios/clientes/pedidos/ventas/caja en cascada.
- Punto 10: payment_methods llega como objeto real; CHECK de Cliente.estado bloqueó correctamente un valor inválido (Postgres 23514, confirmado en logs).

Bugs nuevos encontrados y corregidos en esta sesión (NO eran de los 10 puntos — drift previo entre schema.prisma y la BD real, nunca migrado):
- Restaurante.plan_status y plan_expires_at no existían → signup roto (500 en restaurante.findFirst). Fix aplicado: migración 20260623050000_add_missing_plan_status_columns. Con esto ya se puede aplicar también el CHECK Restaurante_plan_status_check pendiente de la migración 20260623040000.
- Pedido.payment_status/payment_provider/payment_transaction_id/payment_captured_at no existían → crear pedido roto (500 en pedido.create, columna usada en el RETURNING implícito aunque ninguna ruta los lea/escriba hoy). Fix aplicado: migración 20260623060000_add_missing_pedido_payment_columns.
- AuditLog no existía como tabla → audit() fallaba en silencio (ya tenía try/catch en lib/audit.js, no rompía requests, pero el audit trail nunca se guardaba). Fix aplicado: migración 20260623070000_create_auditlog_table.
- next_ticket_numero (Punto 5) tenía los parámetros p_rid/p_inicial como INTEGER, pero Prisma los envía como BIGINT desde $queryRaw — bigint→integer es cast de "assignment" no "implicit", Postgres no resolvía la llamada. Fix aplicado: migración 20260623080000_fix_next_ticket_numero_arg_types (función recreada con BIGINT).

Las 4 migraciones de fixes nuevos (050000-080000) y los ALTER directos correspondientes ya se aplicaron en Supabase real (no solo escritas — se ejecutaron con $executeRawUnsafe y se registraron en _prisma_migrations). ApiKey sigue sin existir como tabla — no se usa todavía (sin UI), queda pendiente para cuando se implemente esa feature.


✅ Fix — "Transaction already closed" al crear pedidos con timeout 15000ms (COMPLETADO — 2026-06-23)


Causa real: el bloque POST /api/pedidos (con items[]) hacía ~4 round-trips a la BD por cada ítem dentro de una sola transacción interactiva (findFirst + update de stock, create de inventarioMovimiento, create de pedidoItem) — con latencia alta hacia Supabase (pooler), un pedido de varios ítems agotaba el timeout de 15s antes de terminar.
server/routes/pedidos.js: reescrito el bloque para que la transacción haga un número constante de round-trips sin importar cuántos ítems tenga el pedido:
  - 1 findMany para validar todos los productos a la vez (antes: 1 findFirst por ítem).
  - 1 UPDATE...FROM (VALUES ...) por raw SQL para descontar stock de todos los productos en un solo statement (antes: 1 update por ítem). Las cantidades se agrupan por producto_id antes de armar el VALUES — un UPDATE...FROM con dos filas del mismo id en el source solo aplica una, así que sin agrupar se perdía un decremento si el mismo producto aparecía en dos líneas del pedido.
  - 1 pedidoItem.createMany (antes: N creates en paralelo, pero igual N round-trips sobre la misma conexión de tx).
  - inventarioMovimiento (auditoría, no afecta el stock) se sacó de la transacción — se hace después con un solo createMany sobre req.prisma. Si falla, no revierte el pedido (igual que el resto de los audit() del proyecto, que ya tragan errores).
  - timeout subido de 15000 a 20000ms como margen adicional, no como fix principal.
Verificado contra Supabase real: pedido con 2 líneas del mismo producto (3+2) descontó stock correctamente (50→45, no se perdió el decremento). Pedido con 6 líneas tardó prácticamente lo mismo que con 2 (~10-11s en este entorno, que tiene latencia mala hacia el pooler) — confirma que el tiempo ya no escala con la cantidad de ítems.
Corregido también una referencia desactualizada en el Punto 1: no existe ningún `withTenant(req, fn)` en el código — ver nota arriba.
