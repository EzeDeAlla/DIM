import { injectable, inject } from 'inversify';
import { SocketServer } from '../realtime/socket.server';
import { SocketServerType } from '../realtime/realtime.module';
import { SERVER_EVENTS, ROOM_NAMES } from '../realtime/events';
import { MessageWithSender } from '../interfaces/messages';

@injectable()
export class MessageEventsPublisher {
  constructor(
    @inject(SocketServerType) private socketServer: SocketServer
  ) {}

  /**
   * Emite un nuevo mensaje a todos los participantes de la conversación
   */
  emitNewMessage(conversationId: string, message: MessageWithSender): void {
    try {
      const conversationRoom = ROOM_NAMES.conversation(conversationId);
      const io = this.socketServer.getIO();
      
      io.to(conversationRoom).emit(SERVER_EVENTS.MESSAGE_NEW, {
        id: message.id,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        content: message.content,
        message_type: message.message_type,
        created_at: message.created_at,
        sender: {
          id: message.sender_id,
          first_name: message.sender_name.split(' ')[0] || '',
          last_name: message.sender_name.split(' ').slice(1).join(' ') || '',
          avatar_url: message.sender_avatar || null,
        },
      });
      
      console.log(`Mensaje ${message.id} emitido a conversación ${conversationId}`);
    } catch (error) {
      console.error('Error emitiendo nuevo mensaje:', error);
    }
  }

  /**
   * Emite confirmación de entrega de mensaje (NO persiste, solo reemite)
   */
  emitDelivered(conversationId: string, messageId: string, userId: string, deliveredAt: string): void {
    try {
      const conversationRoom = ROOM_NAMES.conversation(conversationId);
      const io = this.socketServer.getIO();
      
      io.to(conversationRoom).emit(SERVER_EVENTS.MESSAGE_DELIVERED, {
        message_id: messageId,
        user_id: userId,
        delivered_at: deliveredAt,
      });
      
      console.log(`Entrega confirmada para mensaje ${messageId} por usuario ${userId}`);
    } catch (error) {
      console.error('Error emitiendo confirmación de entrega:', error);
    }
  }

  /**
   * Emite confirmación de lectura de mensaje (reemite tras persistir)
   */
  emitRead(conversationId: string, messageId: string, userId: string, readAt: string): void {
    try {
      const conversationRoom = ROOM_NAMES.conversation(conversationId);
      const io = this.socketServer.getIO();
      
      io.to(conversationRoom).emit(SERVER_EVENTS.MESSAGE_READ, {
        message_id: messageId,
        user_id: userId,
        read_at: readAt,
      });
      
      console.log(`Lectura confirmada para mensaje ${messageId} por usuario ${userId}`);
    } catch (error) {
      console.error('Error emitiendo confirmación de lectura:', error);
    }
  }
}