# DIIM - Sistema de Chat Médico

Sistema de chat médico desarrollado con TypeScript, React, Node.js y PostgreSQL, diseñado para facilitar la comunicación entre doctores y administradores en un entorno médico.

## 🚀 Inicio Rápido

### Prerrequisitos

- [Docker](https://www.docker.com/get-started) (versión 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (versión 2.0+)

### Instalación y Ejecución

1. **Clona el repositorio y navega al directorio:**
   ```bash
   git clone <repository-url>
   cd diim
   ```

2. **Levanta todos los servicios con Docker:**
   ```bash
   docker-compose up --build
   ```

   Este comando:
   - Construye las imágenes de Docker
   - Levanta la base de datos PostgreSQL
   - Ejecuta las migraciones de Knex automáticamente
   - Ejecuta las seeds para datos de prueba
   - Inicia el backend API
   - Inicia el frontend React

3. **Accede a la aplicación:**
   - **Frontend**: http://localhost:8080
   - **Backend API**: http://localhost:3001
   - **Swagger Documentation**: http://localhost:3001/api-docs
   - **Base de datos**: localhost:5432

## 🔧 Configuración

### Variables de Entorno

El proyecto maneja variables de entorno de forma diferente para backend y frontend:

#### Backend (API)

Crea un archivo `backend/.env` con las siguientes variables:

```env
# Configuración del servidor
NODE_ENV=development
PORT=3000

# Configuración de la base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medical_chat_db
DB_USER=user
DB_PASSWORD=password
DB_SSL=false

# Configuración de CORS
CORS_ORIGIN=http://localhost:8080

# Configuración de JWT
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_EXPIRES_IN=7d

# Configuración de archivos
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Configuración de logs
LOG_LEVEL=info
```

#### Frontend (React)

El frontend usa **Vite** y maneja las variables de entorno de forma inteligente:

**Para desarrollo local:**
```env
# frontend/.env.local (opcional)
VITE_API_URL=http://localhost:3001/api
```

**Para Docker:**
No necesitas crear archivos `.env` - las variables se pasan como argumentos de build en `docker-compose.yml`.

**Lógica automática del frontend:**
1. **Prioridad 1**: Usa `VITE_API_URL` si está definida
2. **Prioridad 2**: Si está en localhost, usa `http://localhost:3001/api`
3. **Fallback**: Usa `/api` (para proxy de desarrollo)

Esto permite que funcione tanto en Docker como en desarrollo local sin cambios manuales.

### Estructura del Proyecto

```
diim/
├── backend/                 # API Node.js + TypeScript
│   ├── src/
│   │   ├── users/          # Dominio de usuarios
│   │   ├── messages/       # Dominio de mensajes
│   │   ├── conversations/  # Dominio de conversaciones
│   │   ├── settings/       # Dominio de configuraciones
│   │   ├── database/       # Migraciones y seeds
│   │   └── middleware/     # Middlewares de Express
│   └── Dockerfile
├── frontend/               # React + TypeScript
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── api/           # Cliente API
│   └── Dockerfile
├── shared/                 # Tipos y esquemas compartidos
│   └── schemas/           # Esquemas Zod
├── docker-compose.yml     # Configuración de servicios
└── README.md
```

## 👥 Usuarios de Prueba

El sistema incluye usuarios de prueba preconfigurados:

### Administrador
- **Email**: admin@diim.com
- **Contraseña**: admin123
- **Tipo**: Administrador
- **Permisos**: Acceso completo al sistema

### Doctor
- **Email**: doctor@diim.com
- **Contraseña**: doctor123
- **Tipo**: Doctor
- **Permisos**: Gestión de pacientes y conversaciones

### Administrador del Sistema
- **Email**: administrador@diim.com
- **Contraseña**: administrador123
- **Tipo**: Administrador del Sistema
- **Permisos**: Gesion de pacientes y conversaciones

## 🛠️ Desarrollo

### Comandos Útiles

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f api-service
docker-compose logs -f web-client
docker-compose logs -f database

# Reiniciar un servicio específico
docker-compose restart api-service

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (CUIDADO: elimina datos)
docker-compose down -v
```

### Base de Datos

```bash
# Ejecutar migraciones manualmente
docker-compose exec api-service npm run knex migrate:latest

# Ejecutar seeds manualmente
docker-compose exec api-service npm run knex seed:run

# Acceder a la base de datos
docker-compose exec database psql -U diim_user -d diim_db
```

### Desarrollo Frontend

```bash
# Instalar dependencias (si trabajas localmente)
cd frontend
npm install

# Ejecutar en modo desarrollo
npm start
```

### Desarrollo Backend

```bash
# Instalar dependencias (si trabajas localmente)
cd backend
npm install

# Ejecutar en modo desarrollo
npm run dev
```

## 📚 API Documentation

La documentación completa de la API está disponible en:
- **Swagger UI**: http://localhost:3001/api-docs
- **OpenAPI Spec**: http://localhost:3001/api-docs.json

### Endpoints Principales

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registro de usuarios
- `GET /api/users` - Listar usuarios
- `POST /api/messages/send` - Enviar mensaje
- `GET /api/conversations` - Listar conversaciones
- `GET /api/settings` - Obtener configuraciones

## 🔒 Seguridad

- **Autenticación**: JWT tokens
- **Validación**: Esquemas Zod para validación de datos
- **CORS**: Configurado para desarrollo local
- **Content-Type**: Validación estricta para endpoints protegidos

## 🧪 Testing

```bash
# Ejecutar tests del backend
docker-compose exec api-service npm test

# Ejecutar tests del frontend
docker-compose exec web-client npm test
```

## 📦 Tecnologías

### Backend
- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **Knex.js** - Query builder y migraciones
- **PostgreSQL** - Base de datos
- **Inversify** - Inyección de dependencias
- **Zod** - Validación de esquemas
- **JWT** - Autenticación

### Frontend
- **React** + **TypeScript**
- **TanStack Query** - Gestión de estado del servidor
- **Axios** - Cliente HTTP
- **Zod** - Validación de esquemas

### DevOps
- **Docker** + **Docker Compose**
- **PostgreSQL** - Base de datos
- **Nginx** - Proxy reverso (producción)

## 🚨 Solución de Problemas

### Error: "relation 'users' does not exist"
```bash
# Reinicia los servicios para ejecutar migraciones
docker-compose down
docker-compose up --build
```

### Error: "Port already in use"
```bash
# Verifica qué proceso está usando el puerto
lsof -i :3001
lsof -i :8080
lsof -i :5432

# Detén el proceso o cambia el puerto en docker-compose.yml
```

### Error: "Database connection failed"
```bash
# Verifica que la base de datos esté corriendo
docker-compose ps

# Revisa los logs de la base de datos
docker-compose logs database
```

## 📝 Licencia

Este proyecto es privado y confidencial.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas sobre el proyecto, contacta al equipo de desarrollo.

---

**Nota**: Este README asume que tienes Docker y Docker Compose instalados. Si encuentras algún problema, revisa la sección de solución de problemas o contacta al equipo de desarrollo.