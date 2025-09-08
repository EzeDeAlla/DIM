# Dockerfile multi-etapa optimizado para el frontend

# Etapa de construcción
FROM node:18-alpine AS builder

# Instalar herramientas de build para mejor performance
RUN apk add --no-cache git

WORKDIR /app

# Configurar npm para mejor performance
RUN npm config set fund false && \
    npm config set audit false && \
    npm config set progress false && \
    npm config set prefer-offline true

# Crear directorio para shared
RUN mkdir -p ../shared

# Copiar shared module completo (necesario para imports)
COPY shared/ ../shared/

# Instalar dependencias del módulo shared primero
WORKDIR /shared
RUN npm ci --silent --no-audit --no-fund --prefer-offline --ignore-scripts

# Volver al directorio principal y copiar archivos de dependencias del frontend
WORKDIR /app
COPY frontend/package*.json ./

# Instalar dependencias con optimizaciones
RUN npm ci --silent --no-audit --no-fund --prefer-offline --ignore-scripts

# Copiar archivos de configuración (layer separada para mejor cache)
COPY frontend/tsconfig*.json ./
COPY frontend/vite.config.ts ./
COPY frontend/tailwind.config.js ./
COPY frontend/components.json ./

# Copiar SOLO el código fuente necesario (NO node_modules ni build)
COPY frontend/src ./src/
COPY frontend/public ./public/
COPY frontend/index.html ./

# Argumentos de construcción para configuración
ARG VITE_API_URL=http://api-service:3000
ARG NODE_ENV=production
ENV VITE_API_URL=$VITE_API_URL
ENV NODE_ENV=$NODE_ENV
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Construir la aplicación para producción con optimizaciones
RUN npm run build:docker

# Etapa de producción con nginx
FROM nginx:1.25-alpine AS production

# Instalar dumb-init para manejo correcto de señales
RUN apk add --no-cache dumb-init

# Crear usuario no-root para nginx
RUN addgroup -g 1001 -S nginx_group && \
    adduser -S frontend -u 1001 -G nginx_group

# Copiar archivos construidos desde la etapa builder
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Ajustar permisos
RUN chown -R frontend:nginx_group /usr/share/nginx/html && \
    chown -R frontend:nginx_group /var/cache/nginx && \
    chown -R frontend:nginx_group /var/log/nginx && \
    chown -R frontend:nginx_group /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown frontend:nginx_group /var/run/nginx.pid

# Cambiar al usuario no-root
USER frontend

# Exponer puerto
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Comando de inicio
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]
