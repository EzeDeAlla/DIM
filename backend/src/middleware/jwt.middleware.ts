import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../interfaces/common';
import * as jwtUtil from '../utils/jwt.util';
import { container } from '../config/inversify.config';
import { TYPES } from '../types/container.types';
import { IAuthRepository } from '../interfaces/auth';

export const jwtMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: { 
          code: 'NO_TOKEN',
          message: 'Token de acceso requerido' 
        } 
      });
    }

    // Usar el utilitario JWT para verificar el token
    // El secreto se maneja dentro de la función verify
    const decoded = jwtUtil.verify(token);
    req.userId = decoded.sub;
    
    // Verificar si el usuario está activo
    const authRepository = container.get<IAuthRepository>(TYPES.AuthRepository);
    const user = await authRepository.findUserById(decoded.sub);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ 
        success: false,
        error: { 
          code: 'INACTIVE_USER',
          message: 'Usuario inactivo o no encontrado' 
        } 
      });
    }
    
    // Agregar información del usuario al request
    req.user = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: user.user_type
    };
    
    next();
  } catch (error) {
    console.error('Error en JWT middleware:', error);
    res.status(401).json({ 
      success: false,
      error: { 
        code: 'INVALID_TOKEN',
        message: 'Token inválido' 
      } 
    });
  }
};

export default jwtMiddleware;