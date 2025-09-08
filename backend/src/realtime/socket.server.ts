import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Container } from 'inversify';
import { AuthenticatedSocket, authGuard, isAuthenticated } from './guards';
import { CLIENT_EVENTS, SERVER_EVENTS, ROOM_NAMES } from './events';
import { MessagesService } from '../messages/messages.service';
import { MessageEventsPublisher } from '../messages/message-events.publisher';
import { AuthService } from '../auth/auth.service';
import { TYPES } from '../types/container.types';

export class SocketServer {
  private io: SocketIOServer;
  private container: Container;

  private constructor(httpServer: HttpServer, container: Container) {
    this.container = container;
    
    // Inicializar Socket.IO con CORS
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || [
          'http://localhost:3000', 
          'http://localhost:5173',
          'http://localhost:8080',
          'http://web-client:80'
        ],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  // Factory estática
  public static create(httpServer: HttpServer, container: Container): SocketServer {
    return new SocketServer(httpServer, container);
  }

  private setupMiddleware(): void {
    // Aplicar guard de autenticación
    this.io.use(authGuard);
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      if (!isAuthenticated(socket)) {
        socket.disconnect();
        return;
      }

      const authSocket = socket as AuthenticatedSocket;

      console.log(`Usuario ${socket.data.userId} conectado`);

      // Marcar usuario como online en la base de datos
      const authService = this.container.get<AuthService>(TYPES.AuthService);
      authService.setUserOnline(socket.data.userId);

      // Unir al usuario a su room personal
      const userRoom = ROOM_NAMES.user(socket.data.userId);
      socket.join(userRoom);

      // Emitir que el usuario está online
      socket.broadcast.emit(SERVER_EVENTS.USER_ONLINE, {
        userId: socket.data.userId,
        timestamp: new Date().toISOString(),
      });

      // Configurar listeners de eventos
      this.setupConversationEvents(socket);
      this.setupMessageEvents(socket);

      // Manejar desconexión
      socket.on('disconnect', () => {
        console.log(`Usuario ${socket.data.userId} desconectado`);
        
        // Marcar usuario como offline en la base de datos
        const authService = this.container.get<AuthService>(TYPES.AuthService);
        authService.setUserOffline(socket.data.userId);
        
        // Emitir que el usuario está offline
        socket.broadcast.emit(SERVER_EVENTS.USER_OFFLINE, {
          userId: socket.data.userId,
          timestamp: new Date().toISOString(),
        });
      });
    });
  }

  private setupConversationEvents(socket: AuthenticatedSocket): void {
    // Unirse a una conversación
    socket.on(CLIENT_EVENTS.CONVERSATION_JOIN, (conversationId: string) => {
      const conversationRoom = ROOM_NAMES.conversation(conversationId);
      socket.join(conversationRoom);
      console.log(`Usuario ${socket.data.userId} se unió a conversación ${conversationId}`);
    });

    // Salir de una conversación
    socket.on(CLIENT_EVENTS.CONVERSATION_LEAVE, (conversationId: string) => {
      const conversationRoom = ROOM_NAMES.conversation(conversationId);
      socket.leave(conversationRoom);
      console.log(`Usuario ${socket.data.userId} salió de conversación ${conversationId}`);
    });
  }

  private setupMessageEvents(socket: AuthenticatedSocket): void {
    // Enviar mensaje
    socket.on(CLIENT_EVENTS.MESSAGE_SEND, async (payload: any, ack?: Function) => {
      try {
        const messagesService = this.container.get<MessagesService>(TYPES.MessagesService);
        
        // Persistir el mensaje
        const messageResult = await messagesService.sendMessage({
          conversation_id: payload.conversation_id,
          content: payload.content,
          message_type: payload.message_type || 'text',
        }, socket.data.userId);

        if (!messageResult.success) {
          // Propagar el error específico del service
          if (ack) {
            ack({ 
              success: false, 
              error: messageResult.error?.message || 'Error enviando mensaje',
              code: messageResult.error?.code,
              details: messageResult.error?.details
            });
            return;
          }
          throw new Error(messageResult.error?.message || 'Error enviando mensaje');
        }

        const newMessage = messageResult.data;
        
        if (!newMessage) {
          throw new Error('No se pudo obtener el mensaje creado');
        }

        // Emitir el nuevo mensaje usando el publisher
        const publisher = this.container.get<MessageEventsPublisher>(TYPES.MessageEventsPublisher);
        publisher.emitNewMessage(payload.conversation_id, newMessage);

        // Responder con el mensaje persistido
        if (ack) {
          ack({ success: true, message: newMessage });
        }
      } catch (error) {
        console.error('Error enviando mensaje:', error);
        if (ack) {
          ack({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Error enviando mensaje',
            code: 'INTERNAL_ERROR'
          });
        }
      }
    });

    // Confirmar entrega de mensaje (NO persistir)
    socket.on(CLIENT_EVENTS.MESSAGE_ACK_DELIVERED, (payload: { message_id: string; conversation_id: string }) => {
      const publisher = this.container.get<MessageEventsPublisher>(TYPES.MessageEventsPublisher);
      publisher.emitDelivered(
        payload.conversation_id,
        payload.message_id,
        socket.data.userId,
        new Date().toISOString()
      );
    });

    // Marcar mensaje como leído
    socket.on(CLIENT_EVENTS.MESSAGE_MARK_READ, async (payload: { message_id: string; conversation_id: string }) => {
      try {
        const messagesService = this.container.get<MessagesService>(TYPES.MessagesService);
        
        // Persistir la lectura (idempotente)
        const readResult = await messagesService.markMessageAsRead(payload.message_id, socket.data.userId);
        
        if (!readResult.success) {
          console.error('Error marcando mensaje como leído:', readResult.error?.message);
          return;
        }

        // Emitir confirmación de lectura usando el publisher
        const publisher = this.container.get<MessageEventsPublisher>(TYPES.MessageEventsPublisher);
        publisher.emitRead(
          payload.conversation_id,
          payload.message_id,
          socket.data.userId,
          new Date().toISOString()
        );
      } catch (error) {
        console.error('Error marcando mensaje como leído:', error);
      }
    });
  }

  // Método para obtener la instancia de Socket.IO (útil para emitir desde otros servicios)
  public getIO(): SocketIOServer {
    return this.io;
  }

  // Graceful shutdown
  public async close(): Promise<void> {
    return new Promise((resolve) => {
      this.io.close(() => {
        console.log('Socket.IO server cerrado');
        resolve();
      });
    });
  }
}