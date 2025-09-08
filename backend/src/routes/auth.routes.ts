import { Router } from 'express';
import { AuthController } from '../auth/auth.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Endpoints de autenticación y gestión de usuarios
 */

// Función para crear el router de auth después de que el container esté listo
export const createAuthRouter = (): Router => {
  // Crear una instancia del controlador
  const authController = new AuthController();
  
  // Obtener el router configurado del controlador
  const authRouter = authController.getRouter();
  
  // Usar las rutas del controlador
  router.use('/', authRouter);
  
  return router;
};

export { router as authRouter };