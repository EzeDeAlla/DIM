# 📚 Documentación Completa de la API DIM

## 🔗 Endpoints Disponibles

### 🔐 **Authentication** (`/api/auth`)

#### `POST /api/auth/register`
**Registrar un nuevo usuario**

**Body:**
```json
{
  "email": "doctor@example.com",
  "password": "password123",
  "first_name": "Juan",
  "last_name": "Pérez",
  "user_type": "doctor",
  "specialty": "Cardiología",
  "description": "Especialista en cardiología con 10 años de experiencia"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "doctor@example.com",
      "first_name": "Juan",
      "last_name": "Pérez",
      "user_type": "doctor",
      "specialty": "Cardiología",
      "is_active": true
    }
  }
}
```

#### `POST /api/auth/login`
**Iniciar sesión**

**Body:**
```json
{
  "email": "doctor@example.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "refresh_token_here",
    "expires_in": 3600,
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "doctor@example.com",
      "first_name": "Juan",
      "last_name": "Pérez",
      "user_type": "doctor"
    }
  }
}
```

#### `POST /api/auth/logout`
**Cerrar sesión** (Requiere autenticación)

**Headers:**
```
Authorization: Bearer <token>
```

---

### 👥 **Users** (`/api/users`)

#### `GET /api/users`
**Obtener todos los usuarios** (Requiere autenticación)

**Query Parameters:**
- `search` (string): Término de búsqueda
- `user_type` (string): `doctor`, `admin`, `administrador`
- `is_online` (boolean): Filtrar por usuarios en línea

**Headers:**
```
Authorization: Bearer <token>
```

#### `GET /api/users/public`
**Obtener usuarios públicos** (Sin autenticación)

**Query Parameters:**
- `search` (string): Término de búsqueda
- `user_type` (string): `doctor`, `admin`, `administrador`
- `is_online` (boolean): Filtrar por usuarios en línea

#### `GET /api/users/profile`
**Obtener perfil del usuario autenticado** (Requiere autenticación)

**Headers:**
```
Authorization: Bearer <token>
```

#### `GET /api/users/contacts`
**Obtener contactos con filtros** (Requiere autenticación)

**Query Parameters:**
- `search` (string): Término de búsqueda
- `user_type` (string): `doctor`, `admin`, `administrador`
- `is_online` (boolean): Filtrar por usuarios en línea
- `limit` (integer): Límite de resultados (1-100, default: 10)
- `offset` (integer): Offset para paginación (default: 0)

#### `PUT /api/users/profile`
**Actualizar perfil del usuario** (Requiere autenticación)

**Body:**
```json
{
  "first_name": "Juan",
  "last_name": "Pérez",
  "description": "Especialista en cardiología",
  "specialty": "Cardiología"
}
```

#### `PUT /api/users/avatar`
**Actualizar avatar del usuario** (Requiere autenticación)

**Body:**
```json
{
  "avatar_url": "https://example.com/avatar.jpg"
}
```

#### `GET /api/users/{id}`
**Obtener usuario por ID** (Requiere autenticación)

**Path Parameters:**
- `id` (uuid): ID del usuario

#### `PUT /api/users/{id}`
**Actualizar usuario por ID** (Requiere autenticación + permisos)

**Path Parameters:**
- `id` (uuid): ID del usuario

**Body:**
```json
{
  "first_name": "Juan",
  "last_name": "Pérez",
  "description": "Especialista en cardiología",
  "specialty": "Cardiología"
}
```

#### `DELETE /api/users/{id}`
**Eliminar usuario por ID** (Requiere autenticación + permisos de admin)

**Path Parameters:**
- `id` (uuid): ID del usuario

#### `POST /api/users/create`
**Crear usuario por administrador** (Requiere autenticación + permisos de admin)

**Body:**
```json
{
  "email": "doctor@example.com",
  "password": "password123",
  "first_name": "Juan",
  "last_name": "Pérez",
  "user_type": "doctor",
  "specialty": "Cardiología",
  "description": "Especialista en cardiología",
  "is_active": true
}
```

#### `POST /api/users/upload-avatar`
**Subir avatar del usuario** (Requiere autenticación)

**Body (multipart/form-data):**
- `file` (file): Archivo de imagen (JPG, PNG, WebP)

---

### 💬 **Messages** (`/api/messages`)

#### `GET /api/messages/conversations`
**Obtener conversaciones del usuario** (Requiere autenticación)

**Headers:**
```
Authorization: Bearer <token>
```

#### `GET /api/messages/conversation/{id}`
**Obtener mensajes de una conversación** (Requiere autenticación)

**Path Parameters:**
- `id` (uuid): ID de la conversación

**Query Parameters:**
- `limit` (integer): Límite de mensajes (1-100, default: 20)
- `offset` (integer): Offset para paginación (default: 0)
- `before_message_id` (uuid): ID del mensaje anterior para paginación

#### `POST /api/messages/send`
**Enviar mensaje** (Requiere autenticación)

**Body:**
```json
{
  "conversation_id": "123e4567-e89b-12d3-a456-426614174000",
  "recipient_id": "123e4567-e89b-12d3-a456-426614174000",
  "content": "Hola, ¿cómo estás?",
  "message_type": "text"
}
```

#### `PUT /api/messages/read/{id}`
**Marcar mensaje como leído** (Requiere autenticación)

**Path Parameters:**
- `id` (uuid): ID del mensaje

#### `PUT /api/messages/conversation/{conversationId}/read`
**Marcar conversación como leída** (Requiere autenticación)

**Path Parameters:**
- `conversationId` (uuid): ID de la conversación

#### `DELETE /api/messages/{messageId}`
**Eliminar mensaje** (Requiere autenticación)

**Path Parameters:**
- `messageId` (uuid): ID del mensaje

---

### 🗨️ **Conversations** (`/api/conversations`)

#### `GET /api/conversations`
**Obtener conversaciones del usuario** (Requiere autenticación)

#### `GET /api/conversations/{conversationId}`
**Obtener conversación por ID** (Requiere autenticación)

**Path Parameters:**
- `conversationId` (uuid): ID de la conversación

#### `POST /api/conversations`
**Crear nueva conversación** (Requiere autenticación)

**Body:**
```json
{
  "created_by": "123e4567-e89b-12d3-a456-426614174000",
  "is_group": false,
  "title": "Conversación con Dr. Pérez"
}
```

#### `GET /api/conversations/{conversationId}/participants`
**Obtener participantes de una conversación** (Requiere autenticación)

**Path Parameters:**
- `conversationId` (uuid): ID de la conversación

#### `POST /api/conversations/{conversationId}/participants`
**Agregar participante a conversación** (Requiere autenticación)

**Path Parameters:**
- `conversationId` (uuid): ID de la conversación

**Body:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### `DELETE /api/conversations/{conversationId}/participants/{userId}`
**Eliminar participante de conversación** (Requiere autenticación)

**Path Parameters:**
- `conversationId` (uuid): ID de la conversación
- `userId` (uuid): ID del usuario

---

### ⚙️ **Settings** (`/api/settings`)

#### `GET /api/settings`
**Obtener todas las configuraciones** (Requiere autenticación)

#### `GET /api/settings/{key}`
**Obtener configuración por clave** (Requiere autenticación)

**Path Parameters:**
- `key` (string): Clave de la configuración

#### `PUT /api/settings/{key}`
**Actualizar configuración** (Requiere autenticación)

**Path Parameters:**
- `key` (string): Clave de la configuración

**Body:**
```json
{
  "value": "10485760"
}
```

#### `DELETE /api/settings/{key}`
**Eliminar configuración** (Requiere autenticación)

**Path Parameters:**
- `key` (string): Clave de la configuración

---

### 🏥 **Health** (`/api/health`)

#### `GET /api/health`
**Verificar estado del sistema** (Sin autenticación)

**Respuesta:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z",
  "database": "connected",
  "uptime": 3600
}
```

---

## 🔑 **Autenticación**

La API utiliza **JWT (JSON Web Tokens)** para la autenticación. Para acceder a los endpoints protegidos:

1. **Registrarse** o **iniciar sesión** para obtener un token
2. Incluir el token en el header `Authorization: Bearer <token>`

## 📝 **Códigos de Respuesta**

- `200` - OK
- `201` - Created
- `400` - Bad Request (Datos inválidos)
- `401` - Unauthorized (No autenticado)
- `403` - Forbidden (Sin permisos)
- `404` - Not Found
- `500` - Internal Server Error

## 🚀 **URLs de la API**

- **API Base**: `http://localhost:3001/api`
- **Swagger UI**: `http://localhost:3001/api-docs`
- **Health Check**: `http://localhost:3001/api/health`

## 📊 **Datos de Prueba**

### Usuarios disponibles (después de ejecutar semillas):

1. **Dr. María González** - `doctor@medichat.com` / `Password123!`
2. **Carlos Rodríguez** - `admin@medichat.com` / `Password123!`
3. **Ana Martínez** - `administrador@medichat.com` / `Password123!`
4. **Luis Fernández** - `superadmin@medichat.com` / `Password123!`

## 🔧 **Ejemplo de Uso**

```bash
# 1. Iniciar sesión
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "doctor@medichat.com", "password": "Password123!"}'

# 2. Usar el token para acceder a endpoints protegidos
curl -X GET http://localhost:3001/api/users/profile \
  -H "Authorization: Bearer <tu_token_aqui>"
```
