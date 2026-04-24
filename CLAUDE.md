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
- Nodemailer (alertas de stock por SMTP)
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
│   │   ├── mailer.js           # sendStockAlert por SMTP
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
| `SMTP_HOST` | Host SMTP (ej: `smtp.gmail.com`) | Alertas de stock |
| `SMTP_USER` | Usuario SMTP | Alertas de stock |
| `SMTP_PASS` | Contraseña / app-password SMTP | Alertas de stock |
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
- **Alertas de stock**: por email vía Nodemailer al cruzar stock mínimo
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
