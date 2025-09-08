# Documentación Swagger de la API DIM

## Descripción

Este proyecto incluye documentación completa de la API utilizando Swagger/OpenAPI 3.0. La documentación proporciona una interfaz interactiva para explorar y probar todos los endpoints disponibles.

## Acceso a la Documentación

Una vez que el servidor esté ejecutándose, puedes acceder a la documentación Swagger en:

- **URL de la documentación**: `http://localhost:3001/api-docs`
- **JSON de la especificación**: `http://localhost:3001/api-docs/swagger.json`

## Características de la Documentación

### Endpoints Documentados

La documentación incluye todos los endpoints organizados por categorías:

1. **Authentication** - Autenticación y gestión de usuarios
   - `POST /api/auth/register` - Registrar nuevo usuario
   - `POST /api/auth/login` - Iniciar sesión
   - `POST /api/auth/logout` - Cerrar sesión
   - `GET /api/auth/profile` - Obtener perfil del usuario

2. **Users** - Gestión de usuarios y perfiles
   - `GET /api/users` - Obtener todos los usuarios
   - `GET /api/users/public` - Obtener usuarios (público)
   - `GET /api/users/profile` - Obtener perfil del usuario
   - `GET /api/users/contacts` - Obtener contactos con filtros
   - `GET /api/users/online` - Obtener usuarios en línea
   - `POST /api/users` - Crear nuevo usuario (admin)
   - `POST /api/users/create` - Crear usuario por administrador
   - `PUT /api/users/profile` - Actualizar perfil
   - `PUT /api/users/avatar` - Actualizar avatar
   - `GET /api/users/{id}` - Obtener usuario por ID
   - `PUT /api/users/{id}` - Actualizar usuario por ID
   - `DELETE /api/users/{id}` - Eliminar usuario

3. **Conversations** - Gestión de conversaciones
   - `GET /api/conversations` - Obtener conversaciones del usuario
   - `GET /api/conversations/{conversationId}` - Obtener conversación por ID
   - `POST /api/conversations` - Crear nueva conversación

4. **Messages** - Gestión de mensajes y chat
   - `GET /api/messages/conversations` - Obtener conversaciones
   - `GET /api/messages/conversation/{id}` - Obtener mensajes de conversación
   - `POST /api/messages/send` - Enviar mensaje
   - `PUT /api/messages/read/{id}` - Marcar mensaje como leído
   - `PUT /api/messages/conversation/{conversationId}/read` - Marcar conversación como leída
   - `DELETE /api/messages/{messageId}` - Eliminar mensaje

5. **Settings** - Configuraciones del sistema
   - `GET /api/settings` - Obtener todas las configuraciones
   - `GET /api/settings/{key}` - Obtener configuración por clave
   - `PUT /api/settings/{key}` - Actualizar configuración

6. **Health** - Verificación del estado del sistema
   - `GET /api/health` - Verificar estado del sistema

### Esquemas de Datos

La documentación incluye esquemas detallados para:

- **UserResponse** - Estructura de datos de usuario
- **LoginCredentials** - Credenciales de login
- **RegisterData** - Datos de registro
- **AuthResponse** - Respuesta de autenticación
- **Message** - Estructura de mensaje
- **SendMessage** - Datos para enviar mensaje
- **Conversation** - Estructura de conversación
- **CreateConversation** - Datos para crear conversación
- **Setting** - Estructura de configuración
- **UpdateSetting** - Datos para actualizar configuración
- **ErrorResponse** - Respuesta de error
- **SuccessResponse** - Respuesta de éxito

### Autenticación

La mayoría de los endpoints requieren autenticación JWT. En la interfaz de Swagger:

1. Haz clic en el botón "Authorize" (🔒) en la parte superior
2. Ingresa tu token JWT en el formato: `Bearer tu_token_aqui`
3. Haz clic en "Authorize" y luego "Close"

### Pruebas de Endpoints

Puedes probar los endpoints directamente desde la interfaz de Swagger:

1. Selecciona un endpoint
2. Haz clic en "Try it out"
3. Completa los parámetros requeridos
4. Haz clic en "Execute"
5. Revisa la respuesta

## Estructura de Archivos

```
backend/src/
├── config/
│   └── swagger.config.ts          # Configuración principal de Swagger
├── routes/
│   ├── swagger.routes.ts          # Rutas de Swagger UI
│   ├── auth.routes.ts             # Documentación de auth
│   ├── users.routes.ts            # Documentación de usuarios
│   ├── conversations.routes.ts    # Documentación de conversaciones
│   ├── messages.routes.ts         # Documentación de mensajes
│   ├── settings.routes.ts         # Documentación de configuraciones
│   └── health.routes.ts           # Documentación de health
└── index.ts                       # Integración de Swagger en la app
```

## Desarrollo

### Agregar Nuevos Endpoints

Para documentar nuevos endpoints:

1. Agrega la documentación Swagger usando comentarios `@swagger` en el archivo de rutas correspondiente
2. Sigue el formato existente para mantener consistencia
3. Incluye ejemplos de request/response
4. Especifica códigos de estado HTTP apropiados

### Actualizar Esquemas

Para actualizar esquemas de datos:

1. Modifica el archivo `backend/src/config/swagger.config.ts`
2. Agrega o actualiza los esquemas en la sección `components.schemas`
3. Usa referencias (`$ref`) en los endpoints para mantener consistencia

## Notas Técnicas

- La documentación se genera automáticamente desde los comentarios JSDoc
- Los esquemas están definidos en TypeScript y se convierten a OpenAPI
- La interfaz de Swagger UI se sirve estáticamente desde `/api-docs`
- El JSON de la especificación está disponible en `/api-docs/swagger.json`

## Troubleshooting

Si la documentación no se carga:

1. Verifica que el servidor esté ejecutándose
2. Revisa la consola del servidor para errores
3. Asegúrate de que todas las dependencias estén instaladas
4. Verifica que la configuración de Swagger sea correcta

## Dependencias

Las siguientes dependencias son necesarias para la documentación Swagger:

```json
{
  "swagger-jsdoc": "^6.2.8",
  "swagger-ui-express": "^5.0.0",
  "@types/swagger-jsdoc": "^6.0.4",
  "@types/swagger-ui-express": "^4.1.6"
}
```
