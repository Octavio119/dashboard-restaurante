# ── Stage 1: Build frontend ────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY package*.json ./
# --ignore-scripts: el postinstall del root hace "cd server && prisma generate"
# que falla antes de copiar server/. El build de Vite no necesita ese script.
RUN npm ci --legacy-peer-deps --ignore-scripts

COPY . .
RUN npm run build

# ── Stage 2: Production server ─────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app/server

ENV NODE_ENV=production

# openssl es requerido por los engines nativos de Prisma en Alpine
RUN apk add --no-cache openssl

# PM2 para modo cluster
RUN npm install -g pm2

COPY server/ .

# --ignore-scripts: evita que @prisma/client/postinstall corra "prisma generate"
# antes de que podamos limpiar artefactos obsoletos. El path C:/prisma-gen viene
# de un output custom que existió en versiones previas del schema; con --ignore-scripts
# nos aseguramos de que @prisma/client/default.js nunca sea parchado con ese path.
RUN npm ci --omit=dev --ignore-scripts

# Purgar cualquier cliente Prisma anterior (Windows o Linux desactualizado).
RUN rm -rf node_modules/.prisma

# Generar el cliente Prisma limpio para Linux Alpine (linux-musl-openssl-3.0.x).
RUN node_modules/.bin/prisma generate --schema=./prisma/schema.prisma

# Copiar frontend compilado al directorio público del servidor
COPY --from=frontend-builder /app/dist ./public

# Directorio de logs para PM2 (montar como volumen en producción)
RUN mkdir -p /logs

EXPOSE 3000

# Healthcheck — usa ${PORT} para que coincida con la variable que Railway inyecta
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD wget -qO- http://localhost:${PORT:-3000}/api/health || exit 1

CMD ["pm2-runtime", "ecosystem.config.cjs", "--env", "production"]
