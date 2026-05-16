# ── Stage 1: Build frontend ────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ── Stage 2: Production server ─────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app/server

ENV NODE_ENV=production

# PM2 para modo cluster — gestiona workers, reenvía señales y hace graceful restart
RUN npm install -g pm2

# Instalar dependencias de producción del backend
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copiar código del servidor (incluye ecosystem.config.cjs)
COPY server/ .

# Copiar frontend compilado al directorio público del servidor
COPY --from=frontend-builder /app/dist ./public

# Generar Prisma client
RUN npx prisma generate

# Directorio de logs para PM2 (montar como volumen en producción)
RUN mkdir -p /logs

EXPOSE 3000

# Healthcheck — usa ${PORT} para que coincida con la variable que Railway inyecta
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD wget -qO- http://localhost:${PORT:-3000}/api/health || exit 1

# pm2-runtime es el entrypoint correcto para Docker: gestiona el cluster y
# reenvía SIGTERM/SIGINT al proceso hijo en lugar de ignorarlos como haría pm2 start
CMD ["pm2-runtime", "ecosystem.config.cjs", "--env", "production"]
