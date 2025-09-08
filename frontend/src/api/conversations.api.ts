import apiClient from './axios.config';
import { Conversation, CreateConversation } from '../../../shared/schemas';

export interface ConversationsListResponse {
  conversations: Conversation[];
  total: number;
}

export interface CreateConversationData extends CreateConversation {
  participant_ids: string[];
}

// API functions
export const conversationsApi = {
  // Obtener todas las conversaciones del usuario
  getConversations: async () => {
    const response = await apiClient.get('/messages/conversations');
    return response.data;
  },

  // Obtener una conversación específica
  getConversationById: async (conversationId: string) => {
    const response = await apiClient.get(`/conversations/${conversationId}`);
    return response.data;
  },

  // Crear una nueva conversación
  createConversation: async (data: CreateConversationData) => {
    const response = await apiClient.post('/conversations', data);
    return response.data;
  },
};