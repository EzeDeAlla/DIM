import { injectable, inject } from 'inversify';
import { TYPES } from '../types/container.types';
import { type Conversation, type CreateConversation } from '../../../shared/schemas';
import { IConversationsRepository, ConversationWithDetailsBackend, ConversationsListResponseBackend } from '../interfaces/conversations';
import { ApiResponse } from '../interfaces/common';

// Tipo extendido para crear conversación con participantes
interface CreateConversationWithParticipants extends CreateConversation {
  participant_ids: string[];
}

@injectable()
export class ConversationsService {
  constructor(
    @inject(TYPES.ConversationsRepository) private conversationsRepository: IConversationsRepository
  ) {}

  async getConversationsByUserId(userId: string): Promise<ApiResponse<ConversationsListResponseBackend>> {
    try {
      const conversations = await this.conversationsRepository.findConversationsByUserId(userId);
      
      return {
        success: true,
        data: {
          conversations,
          total: conversations.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch conversations',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async getConversationById(conversationId: string, userId: string): Promise<ApiResponse<ConversationWithDetailsBackend | null>> {
    try {
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

      // Verificar que el usuario sea participante de la conversación
      const userConversations = await this.conversationsRepository.findConversationsByUserId(userId);
      const hasAccess = userConversations.some((c: any) => c.id === conversationId);
      
      if (!hasAccess) {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied to this conversation'
          }
        };
      }

      // Obtener detalles de la conversación como si fuera una lista de una sola conversación
      const conversations = await this.conversationsRepository.findConversationsByUserId(userId);
      const conversationWithDetails = conversations.find((c: any) => c.id === conversationId);

      return {
        success: true,
        data: conversationWithDetails || null
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch conversation',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async createConversation(data: CreateConversationWithParticipants): Promise<ApiResponse<ConversationWithDetailsBackend>> {
    try {
      // Crear nueva conversación
      const newConversation = await this.conversationsRepository.createConversation(data);
      
      // Agregar el creador como participante primero
      console.log(`🔧 Agregando creador ${data.created_by} a conversación ${newConversation.id}`);
      try {
        await this.conversationsRepository.addParticipant({
          conversation_id: newConversation.id,
          user_id: data.created_by
        });
        console.log(`✅ Creador ${data.created_by} agregado exitosamente`);
      } catch (error) {
        console.error('❌ Error agregando creador:', error);
      }
      
      // Agregar los demás participantes
      console.log('🔧 Agregando participantes:', data.participant_ids);
      for (const participantId of data.participant_ids) {
        try {
          console.log(`🔧 Agregando participante ${participantId} a conversación ${newConversation.id}`);
          await this.conversationsRepository.addParticipant({
            conversation_id: newConversation.id,
            user_id: participantId
          });
          console.log(`✅ Participante ${participantId} agregado exitosamente`);
        } catch (error) {
          console.error('❌ Error agregando participante:', error);
        }
      }
      
      return {
        success: true,
        data: {
          ...newConversation,
          unread_count: 0,
          participants: [] // Se cargarán cuando se consulte la conversación
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create conversation',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async executeRawQuery(query: string): Promise<any> {
    return await this.conversationsRepository.executeRawQuery(query);
  }
}