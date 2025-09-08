import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { createAuthRouter } from './routes/auth.routes';
import { conversationsRouter } from './routes/conversations.routes';
import { messagesRouter } from './routes/messages.routes';
import { usersRouter } from './routes/users.routes';
import settingsRouter from './routes/settings.routes';
import { healthRouter } from './routes/health.routes';
import { swaggerRouter } from './routes/swagger.routes';
import { container } from './config/inversify.config';
import { SocketServer } from './realtime/socket.server';
import { registerSocketServer } from './realtime/realtime.module';
import { validateContentType } from './middleware/content-type.middleware';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Configurar JSON para que se muestre formateado
app.set('json spaces', 2);

// Rutas básicas
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Backend DIM funcionando correctamente' });
});

// Documentación Swagger
app.use('/api-docs', swaggerRouter);

// Rutas de autenticación (después de registrar SocketServer)
const authRouter = createAuthRouter();
app.use('/api/auth', authRouter);

// Rutas de usuarios
app.use('/api/users', usersRouter);

// Rutas de conversaciones
app.use('/api/conversations', conversationsRouter);

// Rutas de mensajes
app.use('/api/messages', messagesRouter);

// Rutas de configuraciones
app.use('/api/settings', settingsRouter);

// Rutas de health
app.use('/api/health', healthRouter);

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Crear servidor HTTP
const httpServer = createServer(app);

// Inicializar Socket.IO
const socketServer = SocketServer.create(httpServer, container);

// Registrar SocketServer en el contenedor de Inversify
registerSocketServer(container, socketServer);

// Variables para graceful shutdown
let isShuttingDown = false;

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor HTTP ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 Health check disponible en http://localhost:${PORT}/api/health`);
  console.log(`📚 Documentación Swagger disponible en http://localhost:${PORT}/api-docs`);
  console.log(`🔌 Socket.IO servidor iniciado`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) {
    console.log('Shutdown ya en progreso...');
    return;
  }
  
  isShuttingDown = true;
  console.log(`\n${signal} recibido. Iniciando graceful shutdown...`);
  
  try {
    // Cerrar Socket.IO
    console.log('Cerrando Socket.IO server...');
    await socketServer.close();
    
    // Cerrar servidor HTTP
    console.log('Cerrando servidor HTTP...');
    await new Promise<void>((resolve) => {
      httpServer.close(() => {
        console.log('Servidor HTTP cerrado');
        resolve();
      });
    });
    
    console.log('Graceful shutdown completado');
    process.exit(0);
  } catch (error) {
    console.error('Error durante graceful shutdown:', error);
    process.exit(1);
  }
};

// Manejar señales de shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

export default app;
export { httpServer, socketServer };