# Usar Node.js 22 LTS (Alpine para menor peso)
FROM node:22-alpine

# Instalar dependencias necesarias para Prisma y herramientas de red
RUN apk add --no-cache openssl

# Instalar PM2 globalmente para modo cluster en producción
RUN npm install -g pm2

# Directorio de trabajo
WORKDIR /app

# Copiar manifiestos de dependencias — el build context es la raíz del repo
# (railway.json apunta a este Dockerfile con dockerfilePath: "server/Dockerfile",
# pero el contexto sigue siendo la raíz, así que cada COPY necesita el prefijo server/).
COPY server/package*.json ./

# Instalar dependencias (solo producción para velocidad y seguridad).
# --ignore-scripts: el postinstall corre "prisma generate --schema=./prisma/schema.prisma",
# pero prisma/ todavía no existe en esta capa (se copia en el siguiente paso) — sin esto
# el install falla con "Could not load --schema from provided path".
RUN npm install --omit=dev --ignore-scripts

# Copiar el esquema de Prisma para generar el cliente
COPY server/prisma ./prisma/
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copiar el resto del código del servidor
COPY server/. .

# Crear directorio de logs para PM2
RUN mkdir -p /logs

# Puerto expuesto (Railway inyecta PORT en runtime — 3000 es el fallback)
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Node directo: PM2 cluster mode forkeaba workers y Railway no veía el puerto
# abierto hasta que todos terminaban de inicializar, lo que hacía fallar el
# healthcheck. Railway maneja restarts de contenedor (restartPolicyType en
# railway.json) — no necesitamos que PM2 lo haga también.
CMD ["node", "index.js"]
