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

# Instalar dependencias de producción del backend
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copiar código del servidor
COPY server/ .

# Copiar frontend compilado al directorio público del servidor
COPY --from=frontend-builder /app/dist ./public

# Generar Prisma client
RUN npx prisma generate

EXPOSE 3000

# Healthcheck — usa ${PORT} para que coincida con la variable que Railway inyecta
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD wget -qO- http://localhost:${PORT:-3000}/api/health || exit 1

CMD ["node", "index.js"]
