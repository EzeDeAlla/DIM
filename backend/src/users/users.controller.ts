import { Request, Response, Router } from 'express';
import { container } from '../config/inversify.config';
import { UserService } from './users.service';
import { TYPES } from '../types/container.types';
import { CreateUserSchema, UpdateUserSchema, UpdateProfileSchema, CreateUserByAdminSchema } from '../../../shared/schemas';
import { AuthenticatedRequest } from '../interfaces/common';
import { ContactSearchParams, UpdateAvatarData, ContactsResponse, CreateUserByAdminData } from '../interfaces/users';
import { jwtMiddleware } from '../middleware/jwt.middleware';
import { validateContentType } from '../middleware/content-type.middleware';

export class UserController {
  private userService: UserService;
  private router: Router;

  constructor() {
    this.userService = container.get<UserService>(TYPES.UserService);
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /api/users:
     *   get:
     *     summary: Obtener todos los usuarios
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Término de búsqueda
     *       - in: query
     *         name: user_type
     *         schema:
     *           type: string
     *           enum: [doctor, admin, administrador]
     *         description: Tipo de usuario
     *       - in: query
     *         name: is_online
     *         schema:
     *           type: boolean
     *         description: Filtrar por usuarios en línea
     *     responses:
     *       200:
     *         description: Lista de usuarios obtenida exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     */
    this.router.get('/', this.getAllUsers);

    /**
     * @swagger
     * /api/users/profile:
     *   get:
     *     summary: Obtener perfil del usuario autenticado
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Perfil obtenido exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/UserResponse'
     *       401:
     *         description: No autorizado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.get('/profile', jwtMiddleware, this.getProfile);

    /**
     * @swagger
     * /api/users/contacts:
     *   get:
     *     summary: Obtener contactos con filtros
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Término de búsqueda
     *       - in: query
     *         name: user_type
     *         schema:
     *           type: string
     *           enum: [doctor, admin, administrador]
     *         description: Tipo de usuario
     *       - in: query
     *         name: is_online
     *         schema:
     *           type: boolean
     *         description: Filtrar por usuarios en línea
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *           default: 10
     *         description: Límite de resultados
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           minimum: 0
     *           default: 0
     *         description: Offset para paginación
     *     responses:
     *       200:
     *         description: Contactos obtenidos exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     */
    this.router.get('/contacts', this.getContacts);

    /**
     * @swagger
     * /api/users/online:
     *   get:
     *     summary: Obtener usuarios en línea
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Usuarios en línea obtenidos exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     */
    this.router.get('/online', this.getOnlineUsers);

    /**
     * @swagger
     * /api/users:
     *   post:
     *     summary: Crear nuevo usuario (solo admin)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RegisterData'
     *     responses:
     *       201:
     *         description: Usuario creado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       403:
     *         description: Acceso denegado - se requiere permisos de admin
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.post('/', jwtMiddleware, validateContentType, this.createUser);

    /**
     * @swagger
     * /api/users/create:
     *   post:
     *     summary: Crear usuario por administrador
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email, password, first_name, last_name, user_type]
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 example: doctor@example.com
     *               password:
     *                 type: string
     *                 minLength: 8
     *                 example: password123
     *               first_name:
     *                 type: string
     *                 minLength: 2
     *                 maxLength: 50
     *                 example: Juan
     *               last_name:
     *                 type: string
     *                 minLength: 2
     *                 maxLength: 50
     *                 example: Pérez
     *               user_type:
     *                 type: string
     *                 enum: [doctor, admin, administrador]
     *                 example: doctor
     *               specialty:
     *                 type: string
     *                 maxLength: 100
     *                 example: Cardiología
     *               description:
     *                 type: string
     *                 maxLength: 500
     *                 example: Especialista en cardiología
     *               is_active:
     *                 type: boolean
     *                 default: true
     *     responses:
     *       201:
     *         description: Usuario creado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       403:
     *         description: Acceso denegado - se requiere permisos de admin
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.post('/create', jwtMiddleware, validateContentType, this.createUserByAdmin);

    /**
     * @swagger
     * /api/users/profile:
     *   put:
     *     summary: Actualizar perfil de usuario
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: userId
     *         schema:
     *           type: string
     *           format: uuid
     *         description: ID del usuario a actualizar (opcional, por defecto el usuario actual)
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateProfile'
     *     responses:
     *       200:
     *         description: Perfil actualizado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       403:
     *         description: No tienes permisos para actualizar este perfil
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.put('/profile', jwtMiddleware, validateContentType, this.updateProfile);

    /**
     * @swagger
     * /api/users/avatar:
     *   put:
     *     summary: Actualizar avatar del usuario
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateAvatar'
     *     responses:
     *       200:
     *         description: Avatar actualizado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       400:
     *         description: Archivo inválido
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.put('/avatar', jwtMiddleware, validateContentType, this.updateAvatar);

    /**
     * @swagger
     * /api/users/{id}:
     *   get:
     *     summary: Obtener usuario por ID
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: ID del usuario
     *     responses:
     *       200:
     *         description: Usuario obtenido exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/UserResponse'
     *       404:
     *         description: Usuario no encontrado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.get('/:id', this.getUserById);

    /**
     * @swagger
     * /api/users/{id}:
     *   put:
     *     summary: Actualizar usuario por ID
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: ID del usuario
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               first_name:
     *                 type: string
     *                 minLength: 2
     *                 maxLength: 50
     *               last_name:
     *                 type: string
     *                 minLength: 2
     *                 maxLength: 50
     *               email:
     *                 type: string
     *                 format: email
     *               user_type:
     *                 type: string
     *                 enum: [doctor, admin, administrador]
     *               specialty:
     *                 type: string
     *                 maxLength: 100
     *               description:
     *                 type: string
     *                 maxLength: 500
     *               is_active:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Usuario actualizado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       404:
     *         description: Usuario no encontrado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.put('/:id', this.updateUser);

    /**
     * @swagger
     * /api/users/{id}:
     *   delete:
     *     summary: Eliminar usuario por ID
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: ID del usuario
     *     responses:
     *       200:
     *         description: Usuario eliminado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       404:
     *         description: Usuario no encontrado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.delete('/:id', this.deleteUser);
  }

  public getRouter(): Router {
    return this.router;
  }

  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      // Si hay parámetros de filtro, usar getContacts pero adaptar la respuesta
      if (req.query.user_type || req.query.search || req.query.is_online) {
        const params: ContactSearchParams = {
          search: req.query.search as string,
          user_type: req.query.user_type as 'doctor' | 'admin' | 'administrador',
          is_online: req.query.is_online === 'true',
          limit: 100, // Límite alto para mostrar todos
          offset: 0
        };

        const result = await this.userService.getContacts(params);
        
        if (result.success) {
          // Adaptar la respuesta para que coincida con lo que espera el frontend
          res.status(200).json({
            success: true,
            data: result.data?.users || [] // Solo devolver el array de usuarios
          });
        } else {
          res.status(500).json(result);
        }
        return;
      }
      
      const result = await this.userService.getAllUsers();
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      
      if (!id || typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid user ID'
          }
        });
        return;
      }

      const result = await this.userService.getUserById(id);
      
      if (result.success) {
        res.status(200).json(result);
      } else if (result.error?.code === 'NOT_FOUND') {
        res.status(404).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Verificar que el usuario sea admin o administrador
      if (!req.userId || (req.user?.user_type !== 'admin' && req.user?.user_type !== 'administrador')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required'
          }
        });
        return;
      }

      const validationResult = CreateUserSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid user data',
            details: validationResult.error.message
          }
        });
        return;
      }

      const result = await this.userService.createUser(validationResult.data);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid user ID format'
          }
        });
        return;
      }

      const validationResult = UpdateUserSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid user data',
            details: validationResult.error.message
          }
        });
        return;
      }

      const result = await this.userService.updateUser(id, validationResult.data);
      
      if (result.success) {
        res.status(200).json(result);
      } else if (result.error?.code === 'NOT_FOUND') {
        res.status(404).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      
      if (!id || typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid user ID'
          }
        });
        return;
      }

      const result = await this.userService.deleteUser(id);
      
      if (result.success) {
        res.status(200).json(result);
      } else if (result.error?.code === 'NOT_FOUND') {
        res.status(404).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const result = await this.userService.getProfile(req.userId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 500;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId || !req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      // Validar datos con UpdateProfileSchema
      const validationResult = UpdateProfileSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de perfil inválidos',
            details: validationResult.error.issues.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        });
        return;
      }

      // Obtener el ID del usuario a actualizar (puede venir del query param o ser el usuario actual)
      const targetUserId = req.query.userId as string || req.userId;
      
      // Validar permisos: el usuario puede actualizar su propio perfil o ser admin
      const isOwnProfile = targetUserId === req.userId;
      const isAdmin = req.user.user_type === 'admin' || req.user.user_type === 'administrador';
      
      if (!isOwnProfile && !isAdmin) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'No tienes permisos para actualizar este perfil'
          }
        });
        return;
      }

      const result = await this.userService.updateProfile(targetUserId, validationResult.data);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  updateAvatar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    console.log('🔄 [BACKEND] Recibida petición PUT /users/avatar');
    console.log('📋 [BACKEND] Headers:', req.headers);
    console.log('👤 [BACKEND] User ID:', req.userId);
    console.log('📦 [BACKEND] Body:', req.body);
    
    try {
      if (!req.userId) {
        console.log('❌ [BACKEND] Usuario no autenticado');
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const avatarData: UpdateAvatarData = req.body;
      
      if (!avatarData.avatar_url) {
        console.log('❌ [BACKEND] Avatar URL faltante');
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE',
            message: 'Solo se permiten imágenes JPG, PNG o WebP menores a 5MB'
          }
        });
        return;
      }

      console.log('✅ [BACKEND] Procesando actualización de avatar...');
      const result = await this.userService.updateAvatar(req.userId, avatarData);
      console.log('📤 [BACKEND] Resultado del servicio:', result);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        // Manejar errores específicos según la especificación
        if (result.error?.code === 'FILE_ERROR') {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_FILE',
              message: 'Solo se permiten imágenes JPG, PNG o WebP menores a 5MB'
            }
          });
        } else {
          const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 400;
          res.status(statusCode).json(result);
        }
      }
    } catch (error) {
      console.error('❌ [BACKEND] Error en updateAvatar:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  getContacts = async (req: Request, res: Response): Promise<void> => {
    try {
      const params: ContactSearchParams = {
        search: req.query.search as string,
        user_type: req.query.user_type as 'doctor' | 'admin' | 'administrador',
        is_online: req.query.is_online ? req.query.is_online === 'true' : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const result = await this.userService.getContacts(params);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  getOnlineUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.userService.getOnlineUsers();
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  createUserByAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Verificar que el usuario sea admin o administrador
      if (!req.userId || (req.user?.user_type !== 'admin' && req.user?.user_type !== 'administrador')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required'
          }
        });
        return;
      }

      // Validar datos con CreateUserByAdminSchema
      const validationResult = CreateUserByAdminSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de usuario inválidos',
            details: validationResult.error.issues.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        });
        return;
      }

      const userData: CreateUserByAdminData = validationResult.data;
      const result = await this.userService.createUserByAdmin(userData);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        const statusCode = result.error?.code === 'CONFLICT' ? 409 : 400;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
}