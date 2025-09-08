import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/auth.store';
import {
  MessageSend,
  MessageNew,
  MessageDelivered,
  MessageReadEvent,
  UserOnline,
  UserOffline,
} from '../../../../../shared/schemas';

interface ChatSocketHook {
  socket: Socket | null;
  isConnected: boolean;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (
    payload: MessageSend,
    options?: { onOptimistic?: (tempMessage: any) => void }
  ) => Promise<void>;
  ackDelivered: (messageId: string, conversationId: string) => void;
  markRead: (messageId: string, conversationId: string) => void;
}

interface OptimisticMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  isOptimistic: boolean;
}

export const useChatSocket = (): ChatSocketHook => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, user, _hasHydrated } = useAuthStore();
  const queryClient = useQueryClient();
  const currentConversationId = useRef<string | null>(null);

  useEffect(() => {
    // console.log('🔄 useEffect del socket ejecutándose');
    // console.log('💧 Store hidratado:', _hasHydrated);
    // console.log('📋 Token disponible:', !!token);
    // console.log('👤 Usuario disponible:', !!user);
    
    // Esperar a que el store esté hidratado antes de conectar
    if (!_hasHydrated) {
      //console.log('⏳ Esperando hidratación del store...');
      return;
    }
    
    if (!token || !user) {
      //console.log('❌ No hay token o usuario, no se puede conectar el socket');
      return;
    }

    // Crear conexión Socket.IO usando la misma baseURL que axios
      // ('🚀 Creando conexión Socket.IO con token:', token ? 'presente' : 'ausente');
    
    // Determinar la URL del socket basándose en el entorno
    const getSocketUrl = () => {
      const envUrl = (import.meta as any).env?.VITE_API_URL;
      if (envUrl) {
        // Si es una URL completa (desarrollo), usarla directamente
        if (envUrl.startsWith('http')) {
          return envUrl;
        }
        // Si es una ruta relativa (Docker), construir la URL completa
        return `${window.location.protocol}//${window.location.host}`;
      }
      
      // En desarrollo local, usar localhost directamente
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3001';
      }
      
      // En Docker, usar la URL actual del navegador
      return `${window.location.protocol}//${window.location.host}`;
    };
    
    const socketUrl = getSocketUrl();
    // console.log('🌐 Socket URL:', socketUrl);
    
    const socketInstance = io(socketUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket'],
    });

    // Event listeners de conexión
    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Error de conexión Socket.IO:', error);
      setIsConnected(false);
    });

    // Listener: message:new
    socketInstance.on('message:new', (message: MessageNew) => {
      // console.log('🆕 Nuevo mensaje recibido:', message);
      // console.log('🎯 Conversación actual:', currentConversationId.current);
      // console.log('📨 Conversación del mensaje:', message.conversation_id);
      // console.log('🔄 ¿Coinciden?:', currentConversationId.current === message.conversation_id);
      
      if (currentConversationId.current === message.conversation_id) {
        // console.log('✅ Actualizando cache de mensajes para conversación activa');
        
        // Primero intentar actualizar el cache manualmente
        queryClient.setQueryData(
          ['conversation', message.conversation_id, 'messages'],
          (oldData: any) => {
            // console.log('📦 Datos anteriores del cache:', oldData);
            if (!oldData) return { messages: [message] };
            
            // Verificar si el mensaje ya existe (evitar duplicados)
            const messageExists = oldData.messages?.some((msg: any) => msg.id === message.id);
            // console.log('🔍 ¿Mensaje ya existe?:', messageExists);
            
            if (messageExists) return oldData;
            
            // Agregar el nuevo mensaje al final
            const newData = {
               ...oldData,
               messages: [...(oldData.messages || []), message],
             };
            // console.log('🔄 Nuevos datos del cache:', newData);
            return newData;
          }
        );
        
        // Como respaldo, invalidar la query para forzar refetch
        // console.log('🔄 Invalidando query como respaldo...');
        queryClient.invalidateQueries({
          queryKey: ['conversation', message.conversation_id, 'messages']
        });
        
        // TODO: Hacer scroll al final del chat
      } else {
        // Si la conversación NO está abierta, incrementar unreadCount
        queryClient.setQueryData(['conversations'], (oldData: any) => {
          if (!oldData) return oldData;
          
          return oldData.map((conversation: any) => {
            if (conversation.id === message.conversation_id) {
              return {
                ...conversation,
                unread_count: (conversation.unread_count || 0) + 1,
                last_message: message.content,
                last_message_at: message.created_at,
              };
            }
            return conversation;
          });
        });
      }
    });

    // Listener: message:delivered
    socketInstance.on('message:delivered', (data: MessageDelivered) => {
      // console.log('Mensaje entregado:', data);
      
      // Encontrar la conversación que contiene este mensaje
      let targetConversationId: string | null = null;
      
      // Buscar en todas las conversaciones en cache para encontrar el mensaje
      const conversationsData = queryClient.getQueryData(['conversations']) as any[];
      if (conversationsData) {
        for (const conv of conversationsData) {
          const messagesData = queryClient.getQueryData(['conversation', conv.id, 'messages']) as any;
          if (messagesData?.messages?.some((msg: any) => msg.id === data.message_id)) {
            targetConversationId = conv.id;
            break;
          }
        }
      }
      
      // Si encontramos la conversación, actualizar el mensaje
      if (targetConversationId) {
        queryClient.setQueryData(
          ['conversation', targetConversationId, 'messages'],
          (oldData: any) => {
            if (!oldData) return oldData;
            
            return {
              ...oldData,
              messages: oldData.messages?.map((message: any) => {
                if (message.id === data.message_id) {
                  return {
                    ...message,
                    status: 'delivered',
                    delivered_at: data.delivered_at,
                    deliveredBy: {
                      ...message.deliveredBy,
                      [data.user_id]: true,
                    },
                  };
                }
                return message;
              }) || [],
            };
          }
        );
      }
    });

    // Listener: message:read
    socketInstance.on('message:read', (data: MessageReadEvent) => {
      // Encontrar la conversación que contiene este mensaje
      let targetConversationId: string | null = null;
      
      // Buscar en todas las conversaciones en cache para encontrar el mensaje
      const conversationsData = queryClient.getQueryData(['conversations']) as any[];
      if (conversationsData) {
        for (const conv of conversationsData) {
          const messagesData = queryClient.getQueryData(['conversation', conv.id, 'messages']) as any;
          if (messagesData?.messages?.some((msg: any) => msg.id === data.message_id)) {
            targetConversationId = conv.id;
            break;
          }
        }
      }
      
      // Si encontramos la conversación, actualizar optimísticamente y luego invalidar
      if (targetConversationId) {
        // Actualización optimista del mensaje
        queryClient.setQueryData(
          ['conversation', targetConversationId, 'messages'],
          (oldData: any) => {
            if (!oldData) return oldData;
            
            return {
              ...oldData,
              messages: oldData.messages?.map((message: any) => {
                if (message.id === data.message_id) {
                  return {
                    ...message,
                    status: 'read',
                    read_at: data.read_at,
                    isRead: true,
                    readBy: {
                      ...message.readBy,
                      [data.user_id]: data.read_at,
                    },
                  };
                }
                return message;
              }) || [],
            };
          }
        );
      }
    });

    // Listeners de estado de usuarios
    socketInstance.on('user:online', (data: UserOnline) => {
      console.log('🟢 [WebSocket] Usuario conectado:', data.userId, data);
      
      // Invalidar queries para refetch desde backend con el valor real de is_active
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Invalidar queries de mensajes que contengan participantes
      const queries = queryClient.getQueryCache().getAll();
      queries.forEach((query) => {
        if (query.queryKey[0] === 'conversation' && query.queryKey[2] === 'messages') {
          queryClient.invalidateQueries({ queryKey: query.queryKey });
        }
      });
    });

    socketInstance.on('user:offline', (data: UserOffline) => {
      console.log('🔴 [WebSocket] Usuario desconectado:', data.userId, data);
      
      // Invalidar queries para refetch desde backend con el valor real de is_active
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Invalidar queries de mensajes que contengan participantes
      const queries = queryClient.getQueryCache().getAll();
      queries.forEach((query) => {
        if (query.queryKey[0] === 'conversation' && query.queryKey[2] === 'messages') {
          queryClient.invalidateQueries({ queryKey: query.queryKey });
        }
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, queryClient, user?.id, _hasHydrated]);

  // Métodos de interacción
  const joinConversation = (conversationId: string) => {
    if (socket) {
      // console.log('🚪 Uniéndose a conversación:', conversationId);
      // console.log('🔌 Socket conectado:', !!socket);
      currentConversationId.current = conversationId;
      // console.log('🎯 currentConversationId establecido a:', currentConversationId.current);
      socket.emit('conversation:join', conversationId);
      // console.log(`✅ Unido a conversación: ${conversationId}`);
    } else {
      // console.log('❌ No se puede unir a conversación - socket no disponible');
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socket) {
      if (currentConversationId.current === conversationId) {
        currentConversationId.current = null;
      }
      socket.emit('conversation:leave', conversationId);
      // console.log(`Salido de conversación: ${conversationId}`);
    }
  };

  const sendMessage = async (
    payload: MessageSend,
    options?: { onOptimistic?: (tempMessage: any) => void }
  ): Promise<void> => {
    // console.log('📤 sendMessage llamado con payload:', payload);
    // console.log('🔌 Socket estado:', socket ? 'conectado' : 'desconectado');
    // console.log('🔗 isConnected:', isConnected);
    // console.log('👤 Usuario:', user ? user.id : 'no autenticado');
    console.log('🎯 currentConversationId actual:', currentConversationId.current);
    console.log('🔍 conversationId coincide?', currentConversationId.current === payload.conversation_id);
    
    if (!socket || !user) {
      // console.error('❌ Error: Socket no conectado o usuario no autenticado');
      throw new Error('Socket no conectado o usuario no autenticado');
    }

    if (!isConnected) {
      // console.error('❌ Error: Socket no está conectado');
      throw new Error('Socket no está conectado');
    }

    // Crear mensaje optimista
    const optimisticMessage: OptimisticMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: payload.conversation_id,
      sender_id: user.id,
      content: payload.content,
      message_type: payload.message_type || 'text',
      created_at: new Date().toISOString(),
      status: 'sending',
      isOptimistic: true,
    };

      console.log('🚀 Mensaje optimista creado:', optimisticMessage);

    // Llamar callback optimista si se proporciona
    if (options?.onOptimistic) {
      options.onOptimistic(optimisticMessage);
    }

    // Agregar mensaje optimista al cache
    queryClient.setQueryData(
      ['conversation', payload.conversation_id, 'messages'],
      (oldData: any) => {
        // console.log('📊 Cache anterior:', oldData);
        if (!oldData) return { messages: [optimisticMessage] };
        
        const newData = {
          ...oldData,
          messages: [...(oldData.messages || []), optimisticMessage],
        };
        // console.log('📊 Cache actualizado con mensaje optimista:', newData);
        return newData;
      }
    );

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // console.log('⏰ Timeout al enviar mensaje');
        reject(new Error('Timeout al enviar mensaje'));
      }, 10000);

      // console.log('🚀 Emitiendo evento message:send...');
      socket.emit('message:send', payload, (response: any) => {
        clearTimeout(timeout);
        // console.log('✅ Respuesta del servidor:', response);
        
        if (response.success) {
          // console.log('✅ Mensaje enviado exitosamente, actualizando cache...');
          // Reemplazar mensaje optimista con el real
          queryClient.setQueryData(
            ['conversation', payload.conversation_id, 'messages'],
            (oldData: any) => {
              if (!oldData) return oldData;
              
              const updatedData = {
                ...oldData,
                messages: oldData.messages?.map((message: any) => {
                  if (message.id === optimisticMessage.id) {
                    return {
                      ...response.message,
                      status: response.message.status || 'delivered',
                      delivered_at: response.message.delivered_at,
                      deliveryStatus: response.message.status || 'delivered'
                    };
                  }
                  return message;
                }) || [],
              };
              console.log('📊 Cache final actualizado:', updatedData);
              return updatedData;
            }
          );
          resolve();
        } else {
          console.log('❌ Error del servidor, revirtiendo mensaje optimista:', response.error);
          // Remover mensaje optimista en caso de error
          queryClient.setQueryData(
            ['conversation', payload.conversation_id, 'messages'],
            (oldData: any) => {
              if (!oldData) return oldData;
              
              return {
                ...oldData,
                messages: oldData.messages?.filter((message: any) => 
                  message.id !== optimisticMessage.id
                ) || [],
              };
            }
          );
          reject(new Error(response.error || 'Error enviando mensaje'));
        }
      });
    });
  };

  const ackDelivered = (messageId: string, conversationId: string) => {
    if (socket) {
      socket.emit('message:ackDelivered', { message_id: messageId, conversation_id: conversationId });
    }
  };

  const markRead = (messageId: string, conversationId: string) => {
    if (socket) {
      socket.emit('message:markRead', { message_id: messageId, conversation_id: conversationId });
    }
  };

  return {
    socket,
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    ackDelivered,
    markRead,
  };
};