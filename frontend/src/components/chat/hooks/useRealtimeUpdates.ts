import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatSocket } from './useChatSocket';

interface UseRealtimeUpdatesOptions {
  enableMessageUpdates?: boolean;
  enableConversationUpdates?: boolean;
  enableUserStatusUpdates?: boolean;
  conversationId?: string;
}

/**
 * Hook para manejar actualizaciones en tiempo real y sincronizar con TanStack Query cache
 * Separa la lógica de Socket.IO de la lógica de actualización de cache
 */
export const useRealtimeUpdates = (options: UseRealtimeUpdatesOptions = {}) => {
  const {
    enableMessageUpdates = true,
    enableConversationUpdates = true,
    enableUserStatusUpdates = true,
    conversationId
  } = options;

  const queryClient = useQueryClient();
  const { socket, isConnected, joinConversation, leaveConversation } = useChatSocket();

  // Auto-join/leave conversation
  useEffect(() => {
    if (conversationId && isConnected) {
      joinConversation(conversationId);
      return () => leaveConversation(conversationId);
    }
  }, [conversationId, isConnected, joinConversation, leaveConversation]);

  // Configurar listeners específicos según las opciones
  useEffect(() => {
    if (!socket || !isConnected) return;

    const listeners: Array<{ event: string; handler: (...args: any[]) => void }> = [];

    // Actualizaciones de mensajes
    if (enableMessageUpdates) {
      const handleNewMessage = (data: { conversationId: string; message: any }) => {
        // Invalidar queries de mensajes
        queryClient.invalidateQueries({ 
          queryKey: ['messages', data.conversationId] 
        });
        
        // Invalidar conversaciones para actualizar último mensaje
        queryClient.invalidateQueries({ 
          queryKey: ['conversations'] 
        });
        
        // Actualizar contador de mensajes no leídos si no es la conversación actual
        if (data.conversationId !== conversationId) {
          queryClient.setQueryData(
            ['conversations'],
            (oldData: any[]) => {
              return oldData?.map(conv => 
                conv.id === data.conversationId 
                  ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1 }
                  : conv
              );
            }
          );
        }
      };

      const handleMessageRead = (data: { messageId: string; conversationId: string }) => {
        // Actualizar estado de lectura en mensajes
        queryClient.setQueryData(
          ['messages', data.conversationId],
          (oldData: any) => {
            if (!oldData?.pages) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data?.map((message: any) => 
                  message.id === data.messageId 
                    ? { ...message, isRead: true, readAt: new Date().toISOString() }
                    : message
                )
              }))
            };
          }
        );
        
        // Actualizar conversación para reducir contador no leídos
        queryClient.setQueryData(
          ['conversations'],
          (oldData: any[]) => {
            return oldData?.map(conv => 
              conv.id === data.conversationId 
                ? { ...conv, unreadCount: Math.max(0, (conv.unreadCount || 0) - 1) }
                : conv
            );
          }
        );
      };

      listeners.push(
        { event: 'message:new', handler: handleNewMessage },
        { event: 'message:read', handler: handleMessageRead }
      );
    }

    // Actualizaciones de conversaciones
    if (enableConversationUpdates) {
      const handleConversationCreated = (data: { conversation: any }) => {
        // Invalidar y actualizar lista de conversaciones
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        
        // Agregar al cache si es posible
        queryClient.setQueryData(
          ['conversations'],
          (oldData: any[]) => {
            if (!oldData) return [data.conversation];
            // Evitar duplicados
            const exists = oldData.some(conv => conv.id === data.conversation.id);
            return exists ? oldData : [data.conversation, ...oldData];
          }
        );
      };

      listeners.push(
        { event: 'conversation:created', handler: handleConversationCreated }
      );
    }

    // Actualizaciones de estado de usuarios
    if (enableUserStatusUpdates) {
      const handleUserOnline = (data: { userId: string }) => {
        queryClient.setQueryData(
          ['users', 'online'],
          (oldData: string[] = []) => {
            return oldData.includes(data.userId) ? oldData : [...oldData, data.userId];
          }
        );
        
        // Actualizar estado en conversaciones
        queryClient.setQueryData(
          ['conversations'],
          (oldData: any[]) => {
            return oldData?.map(conv => ({
              ...conv,
              participants: conv.participants?.map((participant: any) => 
                participant.id === data.userId 
                  ? { ...participant, isOnline: true }
                  : participant
              )
            }));
          }
        );
      };

      const handleUserOffline = (data: { userId: string }) => {
        queryClient.setQueryData(
          ['users', 'online'],
          (oldData: string[] = []) => {
            return oldData.filter(userId => userId !== data.userId);
          }
        );
        
        // Actualizar estado en conversaciones
        queryClient.setQueryData(
          ['conversations'],
          (oldData: any[]) => {
            return oldData?.map(conv => ({
              ...conv,
              participants: conv.participants?.map((participant: any) => 
                participant.id === data.userId 
                  ? { ...participant, isOnline: false }
                  : participant
              )
            }));
          }
        );
      };

      listeners.push(
        { event: 'user:online', handler: handleUserOnline },
        { event: 'user:offline', handler: handleUserOffline }
      );
    }

    // Registrar todos los listeners
    listeners.forEach(({ event, handler }) => {
      socket.on(event, handler);
    });

    // Cleanup: remover listeners
    return () => {
      listeners.forEach(({ event, handler }) => {
        socket.off(event, handler);
      });
    };
  }, [socket, isConnected, enableMessageUpdates, enableConversationUpdates, enableUserStatusUpdates, conversationId, queryClient]);

  return {
    socket,
    isConnected,
    joinConversation,
    leaveConversation
  };
};

/**
 * Hook simplificado para componentes de chat que necesitan actualizaciones en tiempo real
 */
export const useChatRealtimeUpdates = (conversationId?: string) => {
  return useRealtimeUpdates({
    enableMessageUpdates: true,
    enableConversationUpdates: true,
    enableUserStatusUpdates: true,
    conversationId
  });
};

/**
 * Hook para componentes que solo necesitan estado de usuarios online
 */
export const useUserStatusUpdates = () => {
  return useRealtimeUpdates({
    enableMessageUpdates: false,
    enableConversationUpdates: false,
    enableUserStatusUpdates: true
  });
};