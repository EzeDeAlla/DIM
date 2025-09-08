import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ExtendedError } from 'socket.io/dist/namespace';

// Interfaz para extender los datos del socket
export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    email?: string;
  };
}

// Middleware de autenticación para Socket.IO
export const authGuard = (socket: Socket, next: (err?: ExtendedError) => void) => {
  try {
    console.log('🔐 Autenticando socket...');
    console.log('Auth data:', socket.handshake.auth);
    console.log('Headers:', socket.handshake.headers.authorization);
    
    // Obtener el token del handshake
    const token = socket.handshake.auth?.token || 
                  socket.handshake.headers?.authorization?.replace('Bearer ', '');

    console.log('Token extraído:', token ? 'presente' : 'ausente');

    if (!token) {
      console.log('❌ Token de autenticación requerido');
      return next(new Error('Token de autenticación requerido'));
    }

    // Verificar el JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.log('❌ JWT_SECRET no configurado');
      return next(new Error('JWT_SECRET no configurado'));
    }

    console.log('🔑 Verificando JWT...');
    const decoded = jwt.verify(token, jwtSecret) as any;
    console.log('Token decodificado completo:', decoded);
    
    // El JWT usa 'sub' como campo para el userId
    const userId = decoded.sub || decoded.userId;
    console.log('UserId extraído:', userId);

    if (!userId) {
      console.log('❌ Token inválido: userId no encontrado en sub o userId');
      return next(new Error('Token inválido'));
    }

    // Configurar datos del usuario en el socket
    socket.data = {
      userId: userId,
      email: decoded.email,
    };

    console.log('✅ Socket autenticado exitosamente para usuario:', userId);
    next();
  } catch (error) {
    console.error('❌ Error en autenticación Socket.IO:', error);
    next(new Error('Token inválido'));
  }
};

// Helper para verificar si el socket está autenticado
export const isAuthenticated = (socket: Socket): socket is AuthenticatedSocket => {
  return socket.data && typeof socket.data.userId === 'string';
};