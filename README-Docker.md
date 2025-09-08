# Guía de Docker para DIM (Medical Chat)

Esta guía explica cómo ejecutar la aplicación DIM utilizando Docker y Docker Compose.

## Prerrequisitos

- Docker Desktop o Docker Engine instalado
- Docker Compose v3.8 o superior

## Estructura del Proyecto

```
dim/
├── backend/
│   ├── Dockerfile
│   ├── .env.example
│   └── ... (código del backend)
├── frontend/
│   ├── Dockerfile
│   └── ... (código del frontend)
├── docker-compose.yml
└── README-Docker.md
```

## Servicios

La aplicación está compuesta por 3 servicios:

### 1. Database (PostgreSQL)
- **Imagen**: postgres:14-alpine
- **Puerto**: 5432
- **Base de datos**: medical_chat_db
- **Usuario**: user
- **Contraseña**: password

### 2. API Service (Backend)
- **Puerto externo**: 3001
- **Puerto interno**: 3000
- **Tecnología**: Node.js + Express + TypeScript
- **Base de datos**: PostgreSQL

### 3. Web Client (Frontend)
- **Puerto externo**: 8080
- **Puerto interno**: 80
- **Tecnología**: React + TypeScript + Vite
- **Servidor web**: Nginx

## Instrucciones de Ejecución

### 1. Configuración inicial

Asegúrate de estar en el directorio raíz del proyecto:

```bash
cd /ruta/al/proyecto/dim
```

### 2. Construir y ejecutar los contenedores

#### Opción A: Solo Backend y Base de Datos (Funcional)

Para ejecutar solo el backend con la base de datos:

```bash
docker-compose -f docker-compose-backend.yml up --build -d
```

#### Opción B: Todos los servicios (Frontend con errores)

⚠️ **Nota**: El frontend actualmente tiene errores de TypeScript que impiden su construcción. Use la Opción A por ahora.

```bash
docker-compose up --build -d
```

### 3. Verificar el estado de los servicios

Para backend y base de datos:
```bash
docker-compose -f docker-compose-backend.yml ps
```

Para todos los servicios:
```bash
docker-compose ps
```

### 4. Ver los logs

Para ver los logs del backend:

```bash
docker-compose -f docker-compose-backend.yml logs -f api-service
```

Para ver los logs de la base de datos:

```bash
docker-compose -f docker-compose-backend.yml logs -f database
```

## Acceso a la Aplicación

### Con Backend y Base de Datos

- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **Base de datos PostgreSQL**: localhost:5432

### Con Todos los Servicios (cuando el frontend esté corregido)

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## Variables de Entorno

### Backend (.env.example)

Las principales variables de entorno para el backend son:

```env
# Servidor
NODE_ENV=production
PORT=3000

# Base de datos
DB_HOST=database
DB_PORT=5432
DB_NAME=medical_chat_db
DB_USER=user
DB_PASSWORD=password

# CORS
CORS_ORIGIN=http://localhost:8080

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

### Frontend

El frontend se configura mediante argumentos de construcción en el Dockerfile:

```dockerfile
ARG VITE_API_URL=http://api-service:3000
```

## Base de Datos

### Migraciones Automáticas

Las migraciones de la base de datos se ejecutan automáticamente al iniciar el contenedor del backend.

### Acceso directo a PostgreSQL

Para acceder directamente a la base de datos:

```bash
docker-compose exec database psql -U user -d medical_chat_db
```

### Backup de la base de datos

```bash
docker-compose exec database pg_dump -U user medical_chat_db > backup.sql
```

### Restaurar backup

```bash
docker-compose exec -T database psql -U user -d medical_chat_db < backup.sql
```

## Comandos Útiles

### Detener servicios del backend

```bash
docker-compose -f docker-compose-backend.yml down
```

### Detener todos los servicios

```bash
docker-compose down
```

### Detener y eliminar volúmenes (⚠️ Elimina datos de la BD)

```bash
docker-compose -f docker-compose-backend.yml down -v
```

### Reconstruir solo el backend

```bash
docker-compose -f docker-compose-backend.yml build api-service
docker-compose -f docker-compose-backend.yml up api-service
```

### Ejecutar comandos dentro de los contenedores

```bash
# Backend
docker-compose exec api-service sh

# Frontend  
docker-compose exec web-client sh

# Base de datos
docker-compose exec database sh
```

### Limpiar imágenes no utilizadas

```bash
docker system prune -a
```

## Troubleshooting

### Problemas Comunes

1. **Puerto ya en uso**
   ```bash
   Error: bind: address already in use
   ```
   Solución: Cambiar los puertos en docker-compose.yml o detener los servicios que usan esos puertos.

2. **Error de conexión a la base de datos**
   - Verificar que el servicio database esté ejecutándose
   - Comprobar las variables de entorno de conexión

3. **Frontend no puede conectar con Backend**
   - Verificar la configuración del proxy en nginx
   - Comprobar que api-service esté disponible

### Ver estado de health checks

```bash
docker-compose ps
```

### Reiniciar un servicio específico

```bash
docker-compose restart api-service
```

## Desarrollo

Para desarrollo local, puedes usar:

```bash
# Solo la base de datos
docker-compose up database

# Backend en modo desarrollo (fuera de Docker)
cd backend && npm run dev

# Frontend en modo desarrollo (fuera de Docker)  
cd frontend && npm run dev
```

## Producción

Para producción, asegúrate de:

1. Cambiar las credenciales por defecto
2. Usar secretos seguros para JWT
3. Configurar HTTPS
4. Usar un proxy reverso como Traefik o nginx
5. Configurar backups automáticos de la base de datos

## Estado Actual de la Implementación

### ✅ Completado

- ✅ Backend completamente dockerizado y funcional
- ✅ Base de datos PostgreSQL configurada y funcionando
- ✅ Migraciones de base de datos disponibles (pendiente de ejecutar)
- ✅ Variables de entorno configuradas
- ✅ Red Docker personalizada
- ✅ Volúmenes persistentes para datos
- ✅ Health checks implementados
- ✅ Documentación completa

### ⚠️ Pendiente

- ⚠️ Frontend con errores de TypeScript que impiden la construcción
- ⚠️ Migraciones de base de datos (se pueden ejecutar manualmente)
- ⚠️ Configuración final de CORS para integración completa

### 🚀 Cómo Ejecutar

**Para usar solo el backend (recomendado):**
```bash
docker-compose -f docker-compose-backend.yml up --build -d
```

**Probar que funciona:**
```bash
curl http://localhost:3001/api/health
```

## Próximos Pasos

1. **Corregir errores del frontend**: Resolver las importaciones del módulo shared y errores de TypeScript
2. **Ejecutar migraciones**: Configurar y ejecutar las migraciones de base de datos
3. **Integración completa**: Una vez corregido el frontend, usar el docker-compose.yml completo

## Arquitectura de Red

Los servicios se comunican a través de una red bridge personalizada:

- `api-service` → `database:5432`
- Host → `api-service:3001` (puerto 3001)
- (Futuro) `web-client` → `api-service:3000` (proxy nginx)
- (Futuro) Host → `web-client:8080` (puerto 8080)
