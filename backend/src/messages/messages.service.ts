import { injectable, inject } from 'inversify';
import { TYPES } from '../types/container.types';
import { IMessagesRepository, MessageWithSender, CreateMessageData, MessageListParams, MessagesListResponse, SendMessageData, MessagesPaginationParams } from '../interfaces/messages';
import { Message } from '../../../shared/schemas';
import { IConversationsRepository } from '../interfaces/conversations';
import { ApiResponse } from '../interfaces/common';
import { Knex } from 'knex';

@injectable()
export class MessagesService {
  constructor(
    @inject(TYPES.MessagesRepository) private messagesRepository: IMessagesRepository,
    @inject(TYPES.ConversationsRepository) private conversationsRepository: IConversationsRepository,
    @inject(TYPES.knexType) private knex: Knex,
    @inject(TYPES.SettingsService) private settingsService: any
  ) {}

  async getMessagesByConversation(
    params: MessagesPaginationParams, 
    userId: string
  ): Promise<ApiResponse<MessagesListResponse>> {
    try {
      // Verificar que el usuario tenga acceso a la conversación
      const conversation = await this.conversationsRepository.findConversationById(params.conversation_id);
      
      if (!conversation) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found'
          }
        };
      }

      // Verificar acceso usando la lista de conversaciones del usuario
      const userConversations = await this.conversationsRepository.findConversationsByUserId(userId);
      const hasAccess = userConversations.some((c: any) => c.id === params.conversation_id);
      
      if (!hasAccess) {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied to this conversation'
          }
        };
      }

      const limit = Math.min(params.limit || 50, 100); // Máximo 100 mensajes por página
      const repositoryParams: MessageListParams = {
        conversation_id: params.conversation_id,
        limit: limit + 1, // Obtener uno más para saber si hay más páginas
        offset: params.offset || 0,
        before_message_id: params.before_message_id
      };

      const messages = await this.messagesRepository.findMessagesByConversation(repositoryParams);
      const hasMore = messages.length > limit;
      
      if (hasMore) {
        messages.pop(); // Remover el mensaje extra
      }


      // Obtener participantes de la conversación con su estado online
      const participants = await this.getConversationParticipants(params.conversation_id);

      const total = await this.messagesRepository.getMessagesCount(params.conversation_id);

      return {
        success: true,
        data: {
          messages,
          participants,
          total,
          has_more: hasMore
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch messages',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async sendMessage(data: SendMessageData, senderId: string): Promise<ApiResponse<MessageWithSender & { status: 'delivered'; delivered_at: string }>> {
    try {
      // Verificar que el usuario tenga acceso a la conversación
      const conversation = await this.conversationsRepository.findConversationById(data.conversation_id);
      
      if (!conversation) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found'
          }
        };
      }

      // Verificar acceso del remitente a la conversación
      const senderConversations = await this.conversationsRepository.findConversationsByUserId(senderId);
      const senderHasAccess = senderConversations.some((c: any) => c.id === data.conversation_id);
      
      if (!senderHasAccess) {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied to this conversation'
          }
        };
      }

      // Obtener participantes de la conversación
      const participants = await this.getConversationParticipants(data.conversation_id);
      
      if (participants.length === 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: 'No participants found in conversation'
          }
        };
      }

      // Verificar que el remitente esté en la conversación
      const sender = participants.find(p => p.id === senderId);
      if (!sender) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_IN_CONVERSATION',
            message: 'El usuario no es participante de esta conversación'
          }
        };
      }

      // Verificar que todos los participantes tengan cuentas activas
      const inactiveParticipants = participants.filter(p => !p.is_active);
      if (inactiveParticipants.length > 0) {
        return {
          success: false,
          error: {
            code: 'USER_INACTIVE',
            message: 'No se pueden enviar mensajes porque uno o más participantes tienen la cuenta desactivada'
          }
        };
      }


      // Validar contenido del mensaje
      if (!data.content || data.content.trim().length === 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: 'Message content cannot be empty'
          }
        };
      }

      if (data.content.length > 1000) {
        return {
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: 'Message content too long (max 1000 characters)'
          }
        };
      }

      const createData: CreateMessageData = {
        conversation_id: data.conversation_id,
        sender_id: senderId,
        content: data.content.trim(),
        message_type: 'text'
      };

      const message = await this.messagesRepository.createMessage(createData);
      
      // Obtener el mensaje con información del sender
      const messagesWithSender = await this.messagesRepository.findMessagesByConversation({
        conversation_id: data.conversation_id,
        limit: 1,
        offset: 0
      });

      const messageWithSender = messagesWithSender.find(m => m.id === message.id);

      if (!messageWithSender) {
        throw new Error('Could not retrieve created message');
      }

      // Agregar estado de entrega automático
      const deliveredAt = new Date().toISOString();
      const messageWithStatus = {
        ...messageWithSender,
        status: 'delivered' as const,
        delivered_at: deliveredAt
      };

      return {
        success: true,
        data: messageWithStatus
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to send message',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      // Verificar si los recibos de lectura están habilitados
      const settings = await this.settingsService.getAll();
      
      if (!settings.read_receipts_enabled) {
        return {
          success: true,
          data: { success: false }
        };
      }

      const message = await this.messagesRepository.findMessageById(messageId);
      
      if (!message) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Message not found'
          }
        };
      }

      // Verificar que el usuario tenga acceso a la conversación
      const conversationDetails = await this.conversationsRepository.findConversationsByUserId(userId);
      const hasAccess = conversationDetails.some((c: any) => c.id === message.conversation_id);
      
      if (!hasAccess) {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        };
      }

      const updated = await this.messagesRepository.markMessageAsRead(messageId, userId);
      
      return {
        success: true,
        data: { success: !!updated }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to mark message as read',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<ApiResponse<{ messages_updated: number }>> {
    try {
      // Verificar si los recibos de lectura están habilitados
      const settings = await this.settingsService.getAll();
      
      if (!settings.read_receipts_enabled) {
        return {
          success: true,
          data: { messages_updated: 0 }
        };
      }

      // Verificar que el usuario tenga acceso a la conversación
      const conversation = await this.conversationsRepository.findConversationById(conversationId);
      
      if (!conversation) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found'
          }
        };
      }

      // Verificar acceso del usuario a la conversación
      const userConversations = await this.conversationsRepository.findConversationsByUserId(userId);
      const userHasAccess = userConversations.some((c: any) => c.id === conversationId);
      
      if (!userHasAccess) {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied to this conversation'
          }
        };
      }

      const messagesUpdated = await this.messagesRepository.markConversationAsRead(conversationId, userId);
      
      return {
        success: true,
        data: { messages_updated: messagesUpdated }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to mark conversation as read',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async deleteMessage(messageId: string, userId: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const message = await this.messagesRepository.findMessageById(messageId);
      
      if (!message) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Message not found'
          }
        };
      }

      // Solo el sender puede eliminar su mensaje
      if (message.sender_id !== userId) {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only delete your own messages'
          }
        };
      }

      const deleted = await this.messagesRepository.deleteMessage(messageId, userId);
      
      return {
        success: true,
        data: { success: deleted }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete message',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  private async getConversationParticipants(conversationId: string) {
    try {
      const conversation = await this.conversationsRepository.findConversationById(conversationId);
      if (!conversation) {
        return [];
      }

      // Obtener participantes con su estado online desde la tabla conversation_participants y users
       const participants = await this.knex('conversation_participants as cp')
        .select(
          'u.id',
          'u.first_name',
          'u.last_name', 
          'u.user_type',
          'u.avatar_url',
          'u.is_active',
          'u.is_online'
        )
        .join('users as u', 'cp.user_id', 'u.id')
        .where('cp.conversation_id', conversationId)
        .whereNull('cp.left_at');

      return participants.map((participant: any) => ({
        id: participant.id,
        is_active: participant.is_active,
        is_online: participant.is_online,
        name: `${participant.first_name} ${participant.last_name}`.trim(),
        role: participant.user_type,
        avatar: participant.avatar_url,
        isOnline: participant.is_online || false
      }));
    } catch (error) {
      console.error('Error getting conversation participants:', error);
      return [];
    }
  }
}