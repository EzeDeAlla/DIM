import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'DIM API',
    version: '1.0.0',
    description: 'API para el sistema de mensajería DIM (Doctors Instant Messaging)',
    contact: {
      name: 'Equipo DIM',
      email: 'support@dim.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Servidor de desarrollo'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      // Auth Schemas
      LoginCredentials: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'doctor@example.com'
          },
          password: {
            type: 'string',
            minLength: 8,
            example: 'password123'
          }
        }
      },
      RegisterData: {
        type: 'object',
        required: ['email', 'password', 'first_name', 'last_name', 'user_type'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'doctor@example.com'
          },
          password: {
            type: 'string',
            minLength: 8,
            example: 'password123'
          },
          first_name: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            example: 'Juan'
          },
          last_name: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            example: 'Pérez'
          },
          user_type: {
            type: 'string',
            enum: ['doctor', 'admin', 'administrador'],
            example: 'doctor'
          },
          specialty: {
            type: 'string',
            maxLength: 100,
            example: 'Cardiología'
          },
          description: {
            type: 'string',
            maxLength: 500,
            example: 'Especialista en cardiología con 10 años de experiencia'
          }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              },
              refresh_token: {
                type: 'string',
                example: 'refresh_token_here'
              },
              expires_in: {
                type: 'number',
                example: 3600
              },
              user: {
                $ref: '#/components/schemas/UserResponse'
              }
            }
          }
        }
      },
      // User Schemas
      UserResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'doctor@example.com'
          },
          first_name: {
            type: 'string',
            example: 'Juan'
          },
          last_name: {
            type: 'string',
            example: 'Pérez'
          },
          avatar_url: {
            type: 'string',
            nullable: true,
            example: 'https://example.com/avatar.jpg'
          },
          description: {
            type: 'string',
            nullable: true,
            example: 'Especialista en cardiología'
          },
          user_type: {
            type: 'string',
            enum: ['doctor', 'admin', 'administrador'],
            example: 'doctor'
          },
          specialty: {
            type: 'string',
            nullable: true,
            example: 'Cardiología'
          },
          is_active: {
            type: 'boolean',
            example: true
          },
          is_online: {
            type: 'boolean',
            example: true
          },
          last_online_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: '2024-01-15T10:30:00Z'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00Z'
          }
        }
      },
      UpdateProfile: {
        type: 'object',
        properties: {
          first_name: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            example: 'Juan'
          },
          last_name: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            example: 'Pérez'
          },
          description: {
            type: 'string',
            maxLength: 500,
            example: 'Especialista en cardiología'
          },
          specialty: {
            type: 'string',
            maxLength: 100,
            example: 'Cardiología'
          }
        }
      },
      UpdateAvatar: {
        type: 'object',
        required: ['avatar_url'],
        properties: {
          avatar_url: {
            type: 'string',
            format: 'uri',
            example: 'https://example.com/avatar.jpg'
          }
        }
      },
      // Message Schemas
      Message: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          conversation_id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          sender_id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          content: {
            type: 'string',
            example: 'Hola, ¿cómo estás?'
          },
          message_type: {
            type: 'string',
            enum: ['text', 'image', 'file'],
            example: 'text'
          },
          is_edited: {
            type: 'boolean',
            example: false
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00Z'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00Z'
          }
        }
      },
      SendMessage: {
        type: 'object',
        required: ['content'],
        properties: {
          conversation_id: {
            type: 'string',
            format: 'uuid',
            nullable: true,
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          recipient_id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          content: {
            type: 'string',
            minLength: 1,
            maxLength: 2000,
            example: 'Hola, ¿cómo estás?'
          },
          message_type: {
            type: 'string',
            enum: ['text', 'image', 'file'],
            default: 'text',
            example: 'text'
          }
        }
      },
      // Conversation Schemas
      Conversation: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          created_by: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          is_group: {
            type: 'boolean',
            example: false
          },
          title: {
            type: 'string',
            nullable: true,
            example: 'Conversación con Dr. Pérez'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00Z'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00Z'
          }
        }
      },
      CreateConversation: {
        type: 'object',
        required: ['created_by', 'is_group'],
        properties: {
          created_by: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          is_group: {
            type: 'boolean',
            example: false
          },
          title: {
            type: 'string',
            nullable: true,
            example: 'Conversación con Dr. Pérez'
          }
        }
      },
      // Settings Schemas
      Setting: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            example: 'max_file_size'
          },
          value: {
            type: 'string',
            example: '5242880'
          },
          description: {
            type: 'string',
            example: 'Tamaño máximo de archivo en bytes'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00Z'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00Z'
          }
        }
      },
      UpdateSetting: {
        type: 'object',
        required: ['value'],
        properties: {
          value: {
            type: 'string',
            example: '10485760'
          }
        }
      },
      // Error Schemas
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'VALIDATION_ERROR'
              },
              message: {
                type: 'string',
                example: 'Datos de entrada inválidos'
              },
              details: {
                type: 'string',
                example: 'El campo email es requerido'
              }
            }
          }
        }
      },
      // Success Response Schema
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Operación exitosa'
          },
          data: {
            type: 'object',
            description: 'Datos de respuesta específicos del endpoint'
          }
        }
      },
      // Additional Message Schemas
      MessageWithSender: {
        type: 'object',
        allOf: [
          { $ref: '#/components/schemas/Message' },
          {
            type: 'object',
            properties: {
              sender: {
                $ref: '#/components/schemas/UserResponse'
              },
              is_read: {
                type: 'boolean',
                example: false
              },
              read_at: {
                type: 'string',
                format: 'date-time',
                nullable: true,
                example: '2024-01-15T10:30:00Z'
              }
            }
          }
        ]
      },
      // Conversation with participants
      ConversationWithParticipants: {
        type: 'object',
        allOf: [
          { $ref: '#/components/schemas/Conversation' },
          {
            type: 'object',
            properties: {
              participants: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    user_id: {
                      type: 'string',
                      format: 'uuid',
                      example: '123e4567-e89b-12d3-a456-426614174000'
                    },
                    user: {
                      $ref: '#/components/schemas/UserResponse'
                    },
                    joined_at: {
                      type: 'string',
                      format: 'date-time',
                      example: '2024-01-15T10:30:00Z'
                    }
                  }
                }
              },
              last_message: {
                $ref: '#/components/schemas/MessageWithSender'
              },
              unread_count: {
                type: 'integer',
                example: 3
              }
            }
          }
        ]
      },
      // File upload schemas
      FileUpload: {
        type: 'object',
        required: ['file'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Archivo a subir (imagen o documento)'
          }
        }
      },
      // Health check schema
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'OK'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00Z'
          },
          database: {
            type: 'string',
            example: 'connected'
          },
          uptime: {
            type: 'number',
            example: 3600
          }
        }
      },
      // Additional schemas for missing endpoints
      CreateUserByAdmin: {
        type: 'object',
        required: ['email', 'password', 'first_name', 'last_name', 'user_type'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'doctor@example.com'
          },
          password: {
            type: 'string',
            minLength: 8,
            example: 'password123'
          },
          first_name: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            example: 'Juan'
          },
          last_name: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            example: 'Pérez'
          },
          user_type: {
            type: 'string',
            enum: ['doctor', 'admin', 'administrador'],
            example: 'doctor'
          },
          specialty: {
            type: 'string',
            maxLength: 100,
            example: 'Cardiología'
          },
          description: {
            type: 'string',
            maxLength: 500,
            example: 'Especialista en cardiología'
          },
          is_active: {
            type: 'boolean',
            default: true
          }
        }
      },
      // File upload response
      FileUploadResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                example: 'https://example.com/uploads/avatar.jpg'
              },
              filename: {
                type: 'string',
                example: 'avatar.jpg'
              },
              size: {
                type: 'number',
                example: 1024000
              }
            }
          }
        }
      }
    }
  },
  paths: {
    // Authentication endpoints
    '/api/auth/register': {
      post: {
        summary: 'Registrar un nuevo usuario',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterData' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Usuario registrado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          '400': {
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Iniciar sesión',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginCredentials' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' }
              }
            }
          },
          '401': {
            description: 'Credenciales inválidas',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        summary: 'Cerrar sesión',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Sesión cerrada exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    // Users endpoints
    '/api/users': {
      get: {
        summary: 'Obtener todos los usuarios',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'search',
            schema: { type: 'string' },
            description: 'Término de búsqueda'
          },
          {
            in: 'query',
            name: 'user_type',
            schema: { type: 'string', enum: ['doctor', 'admin', 'administrador'] },
            description: 'Tipo de usuario'
          },
          {
            in: 'query',
            name: 'is_online',
            schema: { type: 'boolean' },
            description: 'Filtrar por usuarios en línea'
          }
        ],
        responses: {
          '200': {
            description: 'Lista de usuarios obtenida exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/users/public': {
      get: {
        summary: 'Obtener usuarios públicos',
        tags: ['Users'],
        parameters: [
          {
            in: 'query',
            name: 'search',
            schema: { type: 'string' },
            description: 'Término de búsqueda'
          },
          {
            in: 'query',
            name: 'user_type',
            schema: { type: 'string', enum: ['doctor', 'admin', 'administrador'] },
            description: 'Tipo de usuario'
          },
          {
            in: 'query',
            name: 'is_online',
            schema: { type: 'boolean' },
            description: 'Filtrar por usuarios en línea'
          }
        ],
        responses: {
          '200': {
            description: 'Lista de usuarios obtenida exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/users/profile': {
      get: {
        summary: 'Obtener perfil del usuario autenticado',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Perfil obtenido exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/UserResponse' }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        summary: 'Actualizar perfil del usuario',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProfile' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Perfil actualizado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/users/contacts': {
      get: {
        summary: 'Obtener contactos con filtros',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'search',
            schema: { type: 'string' },
            description: 'Término de búsqueda'
          },
          {
            in: 'query',
            name: 'user_type',
            schema: { type: 'string', enum: ['doctor', 'admin', 'administrador'] },
            description: 'Tipo de usuario'
          },
          {
            in: 'query',
            name: 'is_online',
            schema: { type: 'boolean' },
            description: 'Filtrar por usuarios en línea'
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            description: 'Límite de resultados'
          },
          {
            in: 'query',
            name: 'offset',
            schema: { type: 'integer', minimum: 0, default: 0 },
            description: 'Offset para paginación'
          }
        ],
        responses: {
          '200': {
            description: 'Contactos obtenidos exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/users/avatar': {
      put: {
        summary: 'Actualizar avatar del usuario',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateAvatar' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Avatar actualizado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/users/create': {
      post: {
        summary: 'Crear usuario por administrador',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUserByAdmin' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Usuario creado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    // Messages endpoints
    '/api/messages/conversations': {
      get: {
        summary: 'Obtener conversaciones del usuario',
        tags: ['Messages'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Conversaciones obtenidas exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/messages/conversation/{id}': {
      get: {
        summary: 'Obtener mensajes de una conversación',
        tags: ['Messages'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID de la conversación'
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            description: 'Límite de mensajes'
          },
          {
            in: 'query',
            name: 'offset',
            schema: { type: 'integer', minimum: 0, default: 0 },
            description: 'Offset para paginación'
          }
        ],
        responses: {
          '200': {
            description: 'Mensajes obtenidos exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/messages/send': {
      post: {
        summary: 'Enviar mensaje',
        tags: ['Messages'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SendMessage' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Mensaje enviado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/messages/read/{id}': {
      put: {
        summary: 'Marcar mensaje como leído',
        tags: ['Messages'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID del mensaje'
          }
        ],
        responses: {
          '200': {
            description: 'Mensaje marcado como leído exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/messages/conversation/{conversationId}/read': {
      put: {
        summary: 'Marcar conversación como leída',
        tags: ['Messages'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'conversationId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID de la conversación'
          }
        ],
        responses: {
          '200': {
            description: 'Conversación marcada como leída exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/messages/{messageId}': {
      delete: {
        summary: 'Eliminar mensaje',
        tags: ['Messages'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'messageId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID del mensaje'
          }
        ],
        responses: {
          '200': {
            description: 'Mensaje eliminado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    // Conversations endpoints
    '/api/conversations': {
      get: {
        summary: 'Obtener conversaciones del usuario',
        tags: ['Conversations'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Conversaciones obtenidas exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      },
      post: {
        summary: 'Crear nueva conversación',
        tags: ['Conversations'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateConversation' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Conversación creada exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/conversations/{conversationId}': {
      get: {
        summary: 'Obtener conversación por ID',
        tags: ['Conversations'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'conversationId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID de la conversación'
          }
        ],
        responses: {
          '200': {
            description: 'Conversación obtenida exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    // Settings endpoints
    '/api/settings': {
      get: {
        summary: 'Obtener todas las configuraciones',
        tags: ['Settings'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Configuraciones obtenidas exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/settings/{key}': {
      get: {
        summary: 'Obtener configuración por clave',
        tags: ['Settings'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'key',
            required: true,
            schema: { type: 'string' },
            description: 'Clave de la configuración'
          }
        ],
        responses: {
          '200': {
            description: 'Configuración obtenida exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      },
      put: {
        summary: 'Actualizar configuración',
        tags: ['Settings'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'key',
            required: true,
            schema: { type: 'string' },
            description: 'Clave de la configuración'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateSetting' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Configuración actualizada exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    // Health endpoint
    '/api/health': {
      get: {
        summary: 'Verificar estado del sistema',
        tags: ['Health'],
        responses: {
          '200': {
            description: 'Sistema funcionando correctamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' }
              }
            }
          }
        }
      }
    },
    // Additional endpoints not documented in controllers
    '/api/users/{id}': {
      get: {
        summary: 'Obtener usuario por ID',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID del usuario'
          }
        ],
        responses: {
          '200': {
            description: 'Usuario obtenido exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/UserResponse' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Usuario no encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      put: {
        summary: 'Actualizar usuario por ID',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID del usuario'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProfile' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Usuario actualizado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          '403': {
            description: 'Sin permisos para actualizar este usuario',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Eliminar usuario por ID',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID del usuario'
          }
        ],
        responses: {
          '200': {
            description: 'Usuario eliminado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          '403': {
            description: 'Sin permisos para eliminar este usuario',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/users/upload-avatar': {
      post: {
        summary: 'Subir avatar del usuario',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/FileUpload' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Avatar subido exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FileUploadResponse' }
              }
            }
          },
          '400': {
            description: 'Archivo inválido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/conversations/{conversationId}/participants': {
      get: {
        summary: 'Obtener participantes de una conversación',
        tags: ['Conversations'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'conversationId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID de la conversación'
          }
        ],
        responses: {
          '200': {
            description: 'Participantes obtenidos exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          '403': {
            description: 'Sin acceso a esta conversación',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      post: {
        summary: 'Agregar participante a conversación',
        tags: ['Conversations'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'conversationId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID de la conversación'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['user_id'],
                properties: {
                  user_id: {
                    type: 'string',
                    format: 'uuid',
                    example: '123e4567-e89b-12d3-a456-426614174000'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Participante agregado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          '403': {
            description: 'Sin permisos para agregar participantes',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/conversations/{conversationId}/participants/{userId}': {
      delete: {
        summary: 'Eliminar participante de conversación',
        tags: ['Conversations'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'conversationId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID de la conversación'
          },
          {
            in: 'path',
            name: 'userId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID del usuario'
          }
        ],
        responses: {
          '200': {
            description: 'Participante eliminado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          '403': {
            description: 'Sin permisos para eliminar participantes',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

// Usar solo la definición manual sin swagger-jsdoc
export const swaggerSpec = swaggerDefinition;
