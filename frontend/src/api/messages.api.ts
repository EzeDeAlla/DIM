import apiClient from './axios.config';
import { Message, SendMessage } from '../../../shared/schemas';

export interface MessagesListResponse {
  messages: Message[];
  total: number;
}

export interface CreateMessageData extends SendMessage {
  // Campos adicionales si son necesarios
}

// API de mensajes
export const messagesApi = {
  // Obtener mensajes de una conversación
  getMessages: async (conversationId: string, page = 1, limit = 50) => {
    const response = await apiClient.get(`/messages/conversation/${conversationId}?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Enviar un nuevo mensaje
  sendMessage: async (data: CreateMessageData) => {
    const response = await apiClient.post('/messages/send', data);
    return response.data;
  },

  // Marcar mensaje como leído
  markAsRead: async (messageId: string) => {
    const response = await apiClient.put(`/messages/read/${messageId}`);
    return response.data;
  },

  // Marcar conversación completa como leída
  markConversationAsRead: async (conversationId: string) => {
    const response = await apiClient.put(`/messages/conversation/${conversationId}/read`);
    return response.data;
  },

  // Eliminar mensaje
  deleteMessage: async (messageId: string) => {
    const response = await apiClient.delete(`/messages/${messageId}`);
    return response.data;
  },
};

export default messagesApi;