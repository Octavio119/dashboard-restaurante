# Usar Node.js 22 LTS (Alpine para menor peso)
FROM node:22-alpine

# Instalar dependencias necesarias para Prisma y herramientas de red
RUN apk add --no-cache openssl

# Directorio de trabajo
WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar dependencias (solo producción para velocidad y seguridad)
RUN npm install --omit=dev

# Copiar el esquema de Prisma para generar el cliente
COPY prisma ./prisma/
RUN npx prisma generate

# Copiar el resto del código del servidor
COPY . .

# Puerto expuesto (Railway inyecta PORT en runtime — 3000 es el fallback)
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar la aplicación
CMD ["node", "index.js"]
