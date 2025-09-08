import { useAxiosQuery, useAxiosMutation } from './useAxiosQuery';
import { messagesApi, CreateMessageData } from '../api/messages.api';

// Hook para obtener mensajes de una conversación
export const useMessages = (conversationId: string, page = 1, limit = 50) => {
  return useAxiosQuery({
    queryKey: ['conversation', conversationId, 'messages'],
    queryFn: () => messagesApi.getMessages(conversationId, page, limit),
    enabled: !!conversationId,
    staleTime: 30000, // 30 segundos
  });
};

// Hook para enviar un mensaje
export const useSendMessage = () => {
  return useAxiosMutation({
    mutationFn: (data: CreateMessageData) => messagesApi.sendMessage(data),
    onSuccess: () => {
      // Invalidar queries de mensajes para refrescar la lista
      // queryClient.invalidateQueries(['messages']);
    },
  });
};

// Hook para marcar mensaje como leído
export const useMarkAsRead = () => {
  return useAxiosMutation({
    mutationFn: (messageId: string) => messagesApi.markAsRead(messageId),
  });
};

// Hook para marcar conversación completa como leída
export const useMarkConversationAsRead = () => {
  return useAxiosMutation({
    mutationFn: (conversationId: string) => messagesApi.markConversationAsRead(conversationId),
  });
};

// Hook para eliminar mensaje
export const useDeleteMessage = () => {
  return useAxiosMutation({
    mutationFn: (messageId: string) => messagesApi.deleteMessage(messageId),
    onSuccess: () => {
      // Invalidar queries de mensajes para refrescar la lista
      // queryClient.invalidateQueries(['messages']);
    },
  });
};