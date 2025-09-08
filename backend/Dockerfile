# Etapa de construcción
FROM node:18-alpine AS builder

WORKDIR /app

# Crear directorio para shared
RUN mkdir -p ../shared

# Copiar shared module primero
COPY shared/ ../shared/

# Instalar dependencias de shared
RUN cd ../shared && npm ci --only=production && npm cache clean --force

# Copiar archivos de dependencias del backend  
COPY backend/package*.json ./
COPY backend/tsconfig.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente del backend
COPY backend/src/ ./src/

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:18-alpine AS production

WORKDIR /app

# Instalar dumb-init y postgresql-client para manejo correcto de señales y verificación de DB
RUN apk add --no-cache dumb-init postgresql-client

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Copiar shared module
COPY shared/ ../shared/

# Instalar dependencias de shared
RUN cd ../shared && npm ci --only=production && npm cache clean --force

# Copiar archivos de dependencias
COPY backend/package*.json ./

# Instalar dependencias de producción y herramientas para migraciones
RUN npm ci --only=production && \
    npm install ts-node@^10.9.1 tsconfig-paths@^4.2.0 && \
    npm cache clean --force

# Copiar aplicación construida desde la etapa builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database ./src/database

# Copiar archivos de configuración para migraciones
COPY backend/knexfile.js ./
COPY backend/knexfile.ts ./
COPY backend/tsconfig.json ./

# Copiar script de inicio
COPY backend/start.sh ./
RUN chmod +x start.sh

# Crear directorio uploads y asignar permisos
RUN mkdir -p uploads/avatars && \
    chown -R backend:nodejs uploads && \
    chown -R backend:nodejs . && \
    chmod -R 755 src/database

# Cambiar al usuario no-root
USER backend

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicio con dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]
