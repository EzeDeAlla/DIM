import { Router } from 'express';
import { UserController } from '../users/users.controller';
import { jwtMiddleware } from '../middleware/jwt.middleware';
import { validateContentType } from '../middleware/content-type.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios y perfiles
 */

// Crear una instancia del controlador
const userController = new UserController();

/**
 * @swagger
 * /api/users/public:
 *   get:
 *     summary: Obtener todos los usuarios (público)
 *     tags: [Users]
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserResponse'
 */
router.get('/public', userController.getAllUsers);

// Obtener el router configurado del controlador
const usersRouter = userController.getRouter();

// Aplicar middleware JWT y Content-Type a todas las rutas de usuarios normales
router.use('/', jwtMiddleware, validateContentType, usersRouter);

export { router as usersRouter };