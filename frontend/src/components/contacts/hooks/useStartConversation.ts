import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../api/axios.config';
import { toast } from 'react-hot-toast';

export interface StartConversationData {
  participant_ids: string[];
  title?: string;
  description?: string;
  created_by: string;
  is_group: boolean;
}

export interface ConversationResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    description?: string;
    participant_ids: string[];
    created_by: string;
    created_at: string;
    updated_at: string;
  };
}

const startConversation = async (data: StartConversationData): Promise<ConversationResponse> => {
  const response = await apiClient.post<ConversationResponse>('/conversations', data);
  return response.data;
};

export const useStartConversation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startConversation,
    onSuccess: (response) => {
      if (response.success && response.data) {
        // Invalidar todas las consultas relacionadas con conversaciones y mensajes
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['all-conversations'] });
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        
        // Esperar un momento para que el monitor agregue el participante
        setTimeout(() => {
          // Refrescar la lista de conversaciones
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          
          // Navegar a la página principal del chat con el ID de la conversación recién creada
          navigate('/app', { 
            state: { 
              selectedConversationId: response.data.id,
              autoSelectConversation: true 
            } 
          });
          
          toast.success('Conversación iniciada correctamente');
        }, 2000); // Esperar 2 segundos para que el monitor procese
      } else {
        toast.error('Error al iniciar conversación');
      }
    },
    onError: (error: any) => {
      console.error('Error al iniciar conversación:', error);
      
      // Mostrar mensaje de error más específico
      const errorMessage = error?.response?.data?.error?.message || 'Error al iniciar conversación';
      toast.error(errorMessage);
    },
  });
};
