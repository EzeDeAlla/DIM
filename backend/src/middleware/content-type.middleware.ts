import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para validar que los endpoints que envían datos
 * tengan Content-Type: application/json
 * Se ejecuta después del JWT middleware
 */
export const validateContentType = (req: Request, res: Response, next: NextFunction): void => {
  // Solo validar en métodos que envían datos en el body
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    if (contentType !== 'application/json') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'Content-Type debe ser application/json'
        }
      });
      return;
    }
  }
  
  next();
};
