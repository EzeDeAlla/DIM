import { useMemo } from 'react';
import { useConversations } from './useConversations';
import { useAuthStore } from '../store/auth.store';

/**
 * Hook que determina si se puede enviar un mensaje en una conversación específica
 * Reglas de negocio:
 * - El usuario debe tener acceso a la conversación
 */
export const useCanSendMessage = (conversationId: string | null) => {
  const { user } = useAuthStore();
  const { data: conversationsData } = useConversations();
  
  const conversationDetails = useMemo(() => {
    if (!conversationId || !conversationsData?.conversations) {
      return null;
    }
    
    const conversation = conversationsData.conversations.find(
      (conv: any) => conv.id === conversationId
    );
    
    return conversation || null;
  }, [conversationId, conversationsData]);

  const canSendMessage = useMemo(() => {
    // Si no hay conversación o usuario, no se puede enviar
    if (!conversationDetails || !user?.id) {
      return {
        canSend: false,
        reason: 'No conversation or user data available',
        offlineParticipants: []
      };
    }

    const participants = conversationDetails.participants || [];
    
    // Verificar que el usuario actual esté en la conversación
    const currentUserParticipant = participants.find((p: any) => p.id === user.id);
    if (!currentUserParticipant) {
      return {
        canSend: false,
        reason: 'User is not a participant in this conversation',
        offlineParticipants: []
      };
    }

    // Siempre permitir envío de mensajes, independientemente del estado online
    return {
      canSend: true,
      reason: 'Puedes enviar mensajes',
      offlineParticipants: []
    };
  }, [conversationDetails, user?.id]);

  return {
    ...canSendMessage,
    conversation: conversationDetails,
    participants: conversationDetails?.participants || [],
    allParticipantsOnline: true // Siempre true ya que permitimos envío sin importar estado online
  };
};
