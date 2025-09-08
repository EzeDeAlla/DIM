import { useAxiosQuery, useAxiosMutation } from './useAxiosQuery';
import { conversationsApi, CreateConversationData } from '../api/conversations.api';

// Hook para obtener todas las conversaciones del usuario
export const useConversations = () => {
  return useAxiosQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationsApi.getConversations(),
    staleTime: 60000, // 1 minuto
  });
};

// Hook para obtener una conversación específica
export const useConversation = (conversationId: string) => {
  return useAxiosQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => conversationsApi.getConversationById(conversationId),
    enabled: !!conversationId,
    staleTime: 30000, // 30 segundos
  });
};

// Hook para crear una nueva conversación
export const useCreateConversation = () => {
  return useAxiosMutation({
    mutationFn: (data: CreateConversationData) => conversationsApi.createConversation(data),
    onSuccess: () => {
      // Invalidar queries de conversaciones para refrescar la lista
      // queryClient.invalidateQueries(['conversations']);
    },
  });
};