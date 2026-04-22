# Dashboard Restaurante

Sistema de gestión para restaurantes: pedidos, reservas, ventas, inventario y analytics en tiempo real.

---

## Capturas

| Pedidos por mesa | Detalle pedido | Registro de venta |
|---|---|---|
| ![mesas](final-2-vista-mesas.png) | ![detalle](final-3-modal-abierto.png) | ![venta](final-9-seccion-ventas.png) |

---

## Características

- **Pedidos** — crea, edita y confirma pedidos con control de stock automático
- **Reservas** — gestión de reservas con vista de calendario y creación de pedido inline
- **Ventas** — registro de ventas con ticket PDF, métodos de pago y resumen del día
- **Inventario** — movimientos de stock con alertas por email cuando el stock baja
- **Clientes** — CRM básico con historial de visitas y clasificación (Nuevo / Regular / VIP)
- **Analytics** — gráficos de ventas por hora, comparación día anterior y top productos
- **Caja** — apertura/cierre de caja con arqueo
- **Roles** — admin, gerente, mozo con permisos diferenciados
- **Tiempo real** — WebSocket (Socket.io) para sincronizar múltiples dispositivos

---

## Requisitos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 18+ |
| PostgreSQL | 14+ |
| npm | 9+ |

---

## Instalación local (desarrollo)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/dashboard-restaurante.git
cd dashboard-restaurante
```

### 2. Instalar dependencias

```bash
# Frontend
npm install --legacy-peer-deps

# Backend
cd server && npm install && cd ..
```

### 3. Configurar base de datos

Crea la base de datos en PostgreSQL:

```sql
CREATE DATABASE dashboard_restaurante;
```

Copia el archivo de entorno del servidor:

```bash
cp server/.env.example server/.env
```

Edita `server/.env` con tus credenciales (ver comentarios dentro del archivo para guía de cada variable):

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/dashboard_restaurante"
JWT_SECRET="clave_larga_y_aleatoria_aqui"
ADMIN_CODE="codigo_para_acciones_criticas"
```

> Genera un JWT_SECRET seguro con: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 4. Crear tablas y usuario admin

```bash
cd server
npx prisma db push
node -e "
const { PrismaClient } = require('./generated/prisma');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function seed() {
  await prisma.restaurante.upsert({
    where: { id: 1 },
    create: { id: 1, nombre: 'Mi Restaurante', slug: 'mi-restaurante', plan: 'basic', activo: true },
    update: {},
  });
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.usuario.upsert({
    where: { email: 'admin@mirestaurante.com' },
    create: { nombre: 'Administrador', email: 'admin@mirestaurante.com', password_hash: hash, rol: 'admin', restaurante_id: 1 },
    update: {},
  });
  console.log('Seed completado — admin@mirestaurante.com / admin123');
  await prisma.\$disconnect();
}
seed().catch(console.error);
"
cd ..
```

### 5. Iniciar en modo desarrollo

```bash
# En dos terminales separadas:
npm run server:dev   # backend en :9000
npm run dev          # frontend en :5173
```

O con un solo comando:

```bash
npm run dev:full
```

Abre [http://localhost:5173](http://localhost:5173) e inicia sesión con `admin@mirestaurante.com` / `admin123`.

---

## Instalación con Docker (recomendado para producción)

### 1. Copiar variables de entorno

```bash
cp .env.example .env
# Edita .env con tus valores (JWT_SECRET, ADMIN_CODE, etc.)
```

### 2. Levantar los servicios

```bash
docker compose up --build -d
```

Esto levanta:
- **app** — servidor + frontend en `:9000`
- **db** — PostgreSQL 16 con volumen persistente
- **redis** — Redis 7 para caché

### 3. Crear tablas y admin inicial

```bash
docker compose exec app npx prisma db push
docker compose exec app node -e "/* mismo script seed de arriba */"
```

### 4. Verificar que todo funciona

```bash
curl http://localhost:9000/api/health
# {"ok":true,"ts":"..."}
```

---

## Producción con PM2

```bash
cd server

# Instalar dependencias de producción
npm ci --omit=dev
npx prisma generate

# Iniciar con PM2 en modo cluster
npm install -g pm2
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup   # configura inicio automático
```

---

## Documentación de la API

Con el servidor corriendo, abre:

```
http://localhost:9000/api/docs
```

Verás la documentación interactiva Swagger con todos los endpoints, parámetros y ejemplos de respuesta.

---

## Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `DATABASE_URL` | URL de conexión PostgreSQL | Sí |
| `JWT_SECRET` | Clave secreta para tokens JWT | Sí |
| `ADMIN_CODE` | Código para acciones críticas (eliminar ventas, etc.) | Sí |
| `PORT` | Puerto del servidor (default: 9000) | No |
| `REDIS_URL` | URL de Redis para caché (default: memoria) | No |
| `SMTP_HOST` | Servidor SMTP para alertas de stock | No |
| `SMTP_USER` | Usuario SMTP | No |
| `SMTP_PASS` | Contraseña SMTP | No |
| `ALERT_EMAIL` | Email que recibe alertas de stock | No |

---

## Scripts disponibles

```bash
# Desarrollo
npm run dev          # Frontend Vite en :5173
npm run server:dev   # Backend Nodemon en :9000
npm run dev:full     # Ambos en paralelo

# Tests
npm run test              # Vitest (frontend)
npm run test:backend      # Jest (backend)
npm run test:all          # Todos
npm run test:coverage     # Con cobertura
npm run test:e2e          # Playwright E2E

# Calidad
npm run lint         # ESLint
npm run lint:fix     # ESLint con autofix

# Build
npm run build        # Compila frontend a /dist
```

---

## Estructura del proyecto

```
dashboard-restaurante/
├── src/                    # Frontend React + Tailwind
│   ├── App.jsx             # Componente principal con toda la lógica UI
│   ├── api.js              # Cliente HTTP con JWT automático
│   ├── AuthContext.jsx     # Contexto de autenticación
│   └── lib/
│       └── pedidoQtyUtils.js
├── server/                 # Backend Express + Prisma
│   ├── routes/             # Endpoints REST
│   ├── middleware/         # Auth, roles, admin code
│   ├── lib/                # Socket, mailer, cache, ventaHelper
│   ├── prisma/             # Schema de base de datos
│   └── ecosystem.config.cjs
├── e2e/                    # Tests Playwright
├── Dockerfile
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## CI/CD

El pipeline de GitHub Actions ejecuta en cada push:

1. **ESLint** — validación de código
2. **Jest** — tests de backend con PostgreSQL real
3. **Vitest** — tests de frontend
4. **Playwright** — tests E2E
5. **Docker build** — valida que la imagen construya correctamente
6. **Deploy** — push a Docker Hub solo en `main` (requiere secrets `DOCKER_USERNAME` y `DOCKER_TOKEN`)

---

## Documentación

| Recurso | Descripción |
|---|---|
| [docs/GUIA_USO.md](docs/GUIA_USO.md) | Flujo de trabajo, roles, stock e ítems de configuración |
| [docs/FAQ.md](docs/FAQ.md) | Preguntas frecuentes e instalación |
| `http://localhost:9000/api/docs` | Swagger UI interactivo con todos los endpoints |

---

## Licencia

MIT
