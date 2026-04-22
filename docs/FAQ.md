# FAQ — Preguntas Frecuentes

## Instalación

**¿Qué versión de Node.js necesito?**
Node.js 18 o superior. Recomendamos 20 LTS. Verifica con `node --version`.

**¿Puedo usar MySQL en vez de PostgreSQL?**
No directamente. El sistema usa Prisma con PostgreSQL. Para usar MySQL habría que cambiar el provider en `prisma/schema.prisma` y revisar las migraciones.

**El comando `prisma db push` falla. ¿Qué hago?**
Verifica que:
1. PostgreSQL esté corriendo: `pg_isready`
2. `DATABASE_URL` en `server/.env` tenga las credenciales correctas
3. La base de datos exista: `CREATE DATABASE dashboard_restaurante;`

**¿Cómo cambio la contraseña del admin?**
Desde el panel de Configuración → Usuarios, o desde la base de datos:
```bash
cd server
node -e "
const { PrismaClient } = require('./generated/prisma');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
bcrypt.hash('nueva_contraseña', 10).then(hash =>
  prisma.usuario.update({ where: { email: 'admin@mirestaurante.com' }, data: { password_hash: hash } })
).then(() => { console.log('OK'); prisma.\$disconnect(); });
"
```

---

## Operación diaria

**¿Por qué el stock no se descuenta al registrar un pedido?**
El stock se descuenta al **confirmar** el pedido como venta (estado `confirmado`), no al crearlo. Esto permite editar ítems antes de cobrar.

**¿Cómo imprimo el ticket?**
Al confirmar una venta aparece el modal con el ticket. Usa el botón "Imprimir" (PDF) o Ctrl+P desde el modal.

**¿Puedo tener varios cajeros a la vez?**
Sí. El sistema usa WebSocket para sincronizar en tiempo real entre múltiples dispositivos/navegadores.

**¿Qué es el ADMIN_CODE?**
Es un código extra que se pide para acciones críticas: eliminar ventas, pedidos, reservas o usuarios. Se configura en `server/.env`. Si lo olvidaste, cámbialo en el archivo `.env` y reinicia el servidor.

**¿Cómo agrego un nuevo empleado?**
Panel de Configuración → Usuarios → Nuevo Usuario. Roles disponibles:
- `admin` — acceso total
- `gerente` — acceso total excepto eliminar datos
- `mozo` — solo pedidos, reservas y ventas (sin configuración ni usuarios)

---

## Errores comunes

**"Unique constraint failed on the fields: (ticket_id)"**
Error resuelto en la versión actual. Si persiste, reinicia el servidor. Era una condición de carrera al generar tickets simultáneamente.

**"Stock insuficiente" al confirmar pedido**
El producto no tiene suficiente stock. Ve a Configuración → Productos y ajusta el stock manualmente, o registra una entrada de inventario.

**El panel no carga / pantalla en blanco**
1. Verifica que el backend esté corriendo: `curl http://localhost:9000/api/health`
2. Revisa la consola del navegador (F12) para ver el error específico
3. Limpia el localStorage: en la consola del navegador ejecuta `localStorage.clear()` y recarga

**"Sesión expirada" aparece constantemente**
El access token dura 1 hora. Si el refresh token también expiró (7 días de inactividad), vuelve a iniciar sesión. Si pasa muy seguido, revisa que `JWT_SECRET` no haya cambiado entre reinicios del servidor.

**El email de alertas de stock no llega**
1. Verifica `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` en `server/.env`
2. Para Gmail, usa una **contraseña de aplicación** (no la contraseña de tu cuenta): [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Revisa spam/correo no deseado

---

## Deployment

**¿Cómo deployar en Heroku?**
```bash
# 1. Crear app en Heroku
heroku create mi-restaurante

# 2. Agregar PostgreSQL
heroku addons:create heroku-postgresql:mini

# 3. Configurar variables de entorno
heroku config:set JWT_SECRET=clave_larga_aqui ADMIN_CODE=mi_codigo NODE_ENV=production

# 4. Deploy
git push heroku main

# 5. Crear tablas
heroku run "cd server && npx prisma db push"
```

**¿Cómo deployar en Railway?**
1. Conecta tu repositorio GitHub en [railway.app](https://railway.app)
2. Agrega un servicio PostgreSQL
3. Copia `DATABASE_URL` desde Railway a las variables de entorno
4. Configura `JWT_SECRET`, `ADMIN_CODE`, `NODE_ENV=production`
5. Railway detecta el `Dockerfile` automáticamente

**¿Cómo deployar en VPS (Ubuntu)?**
```bash
# Instalar dependencias
sudo apt install nodejs npm postgresql

# Clonar y configurar
git clone ... && cd dashboard-restaurante
cp .env.example server/.env  # editar con tus credenciales
npm install --legacy-peer-deps && cd server && npm install

# Build frontend
npm run build

# Crear tablas
cd server && npx prisma db push

# Iniciar con PM2
npm install -g pm2
pm2 start ecosystem.config.cjs --env production
pm2 save && pm2 startup
```

**¿Qué pasa si no configuro Redis?**
El sistema funciona igual. `server/lib/cache.js` usa un Map en memoria como fallback automático. Redis solo mejora el rendimiento en deploys con múltiples instancias (PM2 cluster).

---

## Seguridad

**¿Cómo cambio JWT_SECRET en producción?**
Cambia la variable en tu `.env` o panel de variables del hosting y reinicia el servidor. **Advertencia:** todos los usuarios activos tendrán que iniciar sesión de nuevo porque sus tokens quedarán invalidados.

**¿Es seguro para uso en producción?**
El sistema incluye:
- JWT con refresh tokens
- Bcrypt para contraseñas (cost 10)
- Helmet.js para headers de seguridad
- Rate limiting en todas las rutas y más estricto en login
- Roles y permisos diferenciados
- ADMIN_CODE como segunda capa para acciones destructivas

Para producción también se recomienda: HTTPS (nginx/Caddy como reverse proxy), backups automáticos de PostgreSQL, y monitoreo de logs con PM2.

---

## Contacto y soporte

- Documentación API interactiva: `http://tu-servidor/api/docs`
- Reportar bugs: abre un issue en GitHub
- Soporte: farahfo4715@gmail.com
