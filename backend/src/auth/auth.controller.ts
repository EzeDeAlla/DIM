import { Request, Response, Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../types/container.types';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from '../interfaces/common';
import { jwtMiddleware } from '../middleware/jwt.middleware';
import { LoginSchema, RegisterSchema, RegisterData, UserType } from '../../../shared/schemas';
import { SocketServer } from '../realtime/socket.server';
import { SocketServerType } from '../realtime/realtime.module';
import { SERVER_EVENTS } from '../realtime/events';

export class AuthController {
    private authService: AuthService;
    private socketServer?: SocketServer;
    public router: Router;

  constructor() {
        this.authService = container.get<AuthService>(TYPES.AuthService);
        this.router = Router();
        this.initializeRoutes();
    }
    
    private getSocketServer(): SocketServer {
        if (!this.socketServer) {
            this.socketServer = container.get<SocketServer>(SocketServerType);
        }
        return this.socketServer;
    }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /api/auth/register:
     *   post:
     *     summary: Registrar un nuevo usuario
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RegisterData'
     *     responses:
     *       201:
     *         description: Usuario registrado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       400:
     *         description: Error de validación
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.post('/register', this.register);

    /**
     * @swagger
     * /api/auth/login:
     *   post:
     *     summary: Iniciar sesión
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LoginCredentials'
     *     responses:
     *       200:
     *         description: Login exitoso
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AuthResponse'
     *       401:
     *         description: Credenciales inválidas
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       403:
     *         description: Cuenta desactivada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.post('/login', this.login);

    /**
     * @swagger
     * /api/auth/logout:
     *   post:
     *     summary: Cerrar sesión
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Sesión cerrada exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       401:
     *         description: No autorizado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.post('/logout', jwtMiddleware, this.logout);

    /**
     * @swagger
     * /api/auth/profile:
     *   get:
     *     summary: Obtener perfil del usuario autenticado
     *     tags: [Authentication]
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
    this.router.get('/profile', jwtMiddleware, this.me);
  }

  public getRouter(): Router {
    return this.router;
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const registerData = req.body;
      
      // Validación básica
      if (!registerData.email || !registerData.password || !registerData.first_name || !registerData.last_name) {
        res.status(400).json({ 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Todos los campos son requeridos' 
          } 
        });
        return;
      }

      // Validar el tipo de usuario primero
      const userType = registerData.user_type || 'doctor';
      const validUserTypes: UserType[] = ['doctor', 'admin', 'administrador'];
      if (!validUserTypes.includes(userType)) {
        res.status(400).json({ 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Tipo de usuario inválido' 
          } 
        });
        return;
      }

      // Crear objeto con tipos correctos
      const userData = {
        email: registerData.email as string,
        password: registerData.password as string,
        first_name: registerData.first_name as string,
        last_name: registerData.last_name as string,
        specialty: registerData.specialty as string | undefined,
        description: registerData.description as string | undefined,
        user_type: userType as UserType
      };

      const result = await this.authService.register(userData);
      
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result
      });
    } catch (error) {
      console.error('Error en register:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Error al registrar usuario' 
      });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validar body con LoginSchema.safeParse
      const loginDto = LoginSchema.safeParse(req.body);
      
      if (!loginDto.success) {
        res.status(400).json({ 
          "success": false, 
          "error": { 
            "code": "INVALID_CREDENTIALS", 
            "message": "Email o contraseña incorrectos" 
          } 
        });
        return;
      }
      
      const authResponse = await this.authService.login(loginDto.data);
      
      // Emitir evento user:online
      console.log('🟢 Emitiendo evento user:online para usuario:', authResponse.user.id);
      this.getSocketServer().getIO().emit(SERVER_EVENTS.USER_ONLINE, {
        userId: authResponse.user.id,
        email: authResponse.user.email
      });
      console.log('✅ Evento user:online emitido correctamente');
      
      // Asegurarse de que el usuario aparezca como activo en la respuesta
      // Imprimir el objeto de usuario para depuración
      console.log('Usuario antes de modificar:', JSON.stringify(authResponse.user));
      
      // Crear un nuevo objeto con is_active forzado a true
      const userData = JSON.parse(JSON.stringify(authResponse.user));
      userData.is_active = true;
      
      console.log('Usuario después de modificar:', JSON.stringify(userData));
      
      res.status(200).json({
        "success": true,
        "data": {
          "token": authResponse.token,
          "refresh_token": authResponse.refresh_token,
          "expires_in": authResponse.expires_in,
          "user": userData
        }
      });
    } catch (error: any) {
      console.error('Error en login:', error);
      
      const errorCode = error.message.includes('desactivada') ? 'ACCOUNT_INACTIVE' : 'INVALID_CREDENTIALS';
      const statusCode = errorCode === 'ACCOUNT_INACTIVE' ? 403 : 401;
      
      res.status(statusCode).json({ 
        "success": false, 
        "error": { 
          "code": errorCode, 
          "message": error.message || "Email o contraseña incorrectos"
        } 
      });
    }
  };

  logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ 
          "success": false, 
          "error": { 
            "code": "UNAUTHORIZED", 
            "message": "No autorizado" 
          } 
        });
        return;
      }
      
      // Llamar al servicio para marcar al usuario como inactivo
      await this.authService.logout(req.userId);
      
      // Emitir evento user:offline
      console.log('🔴 Emitiendo evento user:offline para usuario:', req.userId);
      this.getSocketServer().getIO().emit(SERVER_EVENTS.USER_OFFLINE, {
        userId: req.userId
      });
      console.log('✅ Evento user:offline emitido correctamente');
      
      // El cliente debe eliminar el token
      res.status(200).json({
        "success": true,
        "message": "Sesión cerrada correctamente"
      });
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({ 
        "success": false, 
        "error": { 
          "code": "SERVER_ERROR", 
          "message": "Error al cerrar sesión" 
        } 
      });
    }
  };

  me = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'No autorizado' 
          } 
        });
        return;
      }
      
      const user = await this.authService.me(req.userId);
      res.status(200).json({ 
        success: true, 
        data: user
      });
    } catch (error: any) {
      console.error('Error en me:', error);
      res.status(500).json({ 
        success: false, 
        error: { 
          code: 'SERVER_ERROR', 
          message: 'Error al obtener datos del usuario' 
        } 
      });
    }
  }

}