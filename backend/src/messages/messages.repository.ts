import { injectable, inject } from 'inversify';
import { Knex } from 'knex';
import { TYPES } from '../types/container.types';
import { MessageWithSender, CreateMessageData, MessageListParams, IMessagesRepository } from '../interfaces/messages';
import { Message, MessageRead } from '../../../shared/schemas';

@injectable()
export class MessagesRepository implements IMessagesRepository {
  constructor(
    @inject(TYPES.knexType) private knex: Knex
  ) {}

  async findMessagesByConversation(params: MessageListParams): Promise<MessageWithSender[]> {
    const { conversation_id, limit = 50, offset = 0, before_message_id } = params;
    
    let query = this.knex('messages as m')
      .select(
        'm.id',
        'm.conversation_id',
        'm.sender_id',
        'm.content',
        'm.message_type',
        'm.is_edited',
        'm.deleted_at',
        'm.created_at',
        'm.updated_at',
        this.knex.raw("u.first_name || ' ' || u.last_name as sender_name"),
        'u.avatar_url as sender_avatar'
      )
      .leftJoin('users as u', 'm.sender_id', 'u.id')
      .where('m.conversation_id', conversation_id)
      .whereNull('m.deleted_at')
      .orderBy('m.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (before_message_id) {
      const beforeMessage = await this.knex('messages')
        .select('created_at')
        .where('id', before_message_id)
        .first();
      
      if (beforeMessage) {
        query = query.where('m.created_at', '<', beforeMessage.created_at);
      }
    }

    const messages = await query;
    
    // Obtener información de lectura para cada mensaje
    const messageIds = messages.map(m => m.id);
    const readInfo = await this.knex('message_reads as mr')
      .select('mr.message_id', 'mr.user_id', 'mr.read_at')
      .whereIn('mr.message_id', messageIds);

    // Mapear información de lectura a los mensajes
    const messagesWithReadInfo = messages.map(message => {
      const messageReads = readInfo.filter(r => r.message_id === message.id);
      const readBy: Record<string, string> = {};
      
      messageReads.forEach(read => {
        readBy[read.user_id] = read.read_at;
      });

      return {
        ...message,
        status: 'delivered' as const, // Por defecto delivered cuando se obtiene de BD
        delivered_at: message.created_at, // Usar created_at como delivered_at
        readBy,
        is_read: messageReads.length > 0
      };
    });
    
    return messagesWithReadInfo.reverse(); // Devolver en orden cronológico
  }

  async createMessage(data: CreateMessageData): Promise<Message> {
    const [message] = await this.knex('messages')
      .insert({
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return message;
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<MessageRead> {
    try {
      // Solo el receptor puede marcar como leído (no el sender)
      const message = await this.knex('messages')
        .where('id', messageId)
        .whereNot('sender_id', userId)
        .first();
      
      if (!message) {
        throw new Error('Message not found or user is sender');
      }

      // Verificar si ya existe el registro
      const existingRead = await this.knex('message_reads')
        .where({ message_id: messageId, user_id: userId })
        .first();

      if (existingRead) {
        // Si ya existe, actualizar la fecha de lectura
        const messageRead = await this.knex('message_reads')
          .where({ message_id: messageId, user_id: userId })
          .update({ read_at: new Date().toISOString() })
          .returning('*');
        return messageRead[0];
      } else {
        // Si no existe, crear nuevo registro
        const messageRead = await this.knex('message_reads')
          .insert({
            message_id: messageId,
            user_id: userId,
            read_at: new Date().toISOString()
          })
          .returning('*');
        return messageRead[0];
       }
    } catch (error) {
      console.error('Error in markMessageAsRead:', error);
      throw error;
    }
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<number> {
    // Obtener todos los mensajes no leídos de la conversación
    const unreadMessages = await this.knex('messages as m')
      .select('m.id')
      .leftJoin('message_reads as mr', function() {
        this.on('m.id', 'mr.message_id')
            .andOn('mr.user_id', '=', userId);
      })
      .where('m.conversation_id', conversationId)
      .whereNot('m.sender_id', userId)
      .whereNull('mr.message_id');

    if (unreadMessages.length === 0) {
      return 0;
    }

    // Insertar registros en message_reads para cada mensaje no leído
    const now = new Date();
    const messageReads = unreadMessages.map(msg => ({
      message_id: msg.id,
      user_id: userId,
      read_at: now
    }));

    await this.knex('message_reads').insert(messageReads);

    return unreadMessages.length;
  }

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    // Solo el sender puede eliminar su propio mensaje
    const updated = await this.knex('messages')
      .where('id', messageId)
      .where('sender_id', userId)
      .update({
        deleted_at: new Date(),
        updated_at: new Date()
      });

    return updated > 0;
  }

  async findMessageById(messageId: string): Promise<Message | null> {
    const message = await this.knex('messages')
      .where('id', messageId)
      .whereNull('deleted_at')
      .first();

    return message || null;
  }

  async getMessagesCount(conversationId: string): Promise<number> {
    const result = await this.knex('messages')
      .where('conversation_id', conversationId)
      .whereNull('deleted_at')
      .count('* as count')
      .first();

    return parseInt(result?.count as string) || 0;
  }
}