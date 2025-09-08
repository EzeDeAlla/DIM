import React, { useState, useEffect, useCallback } from "react";
import { MessageSquare, Plus, Search, Send, Smile, Paperclip, Phone, Video, Info, ChevronDown } from "lucide-react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { useConversations } from "../../hooks/useConversations";
import { useMessages } from "../../hooks/useMessages";
import { useChatSocket } from "../chat/hooks/useChatSocket";
import { useAutoScroll } from "../chat/hooks/useAutoScroll";
import { MessageItem } from "../chat/MessageItem";
import { useAuthStore } from "../../store/auth.store";
import { toast } from "react-hot-toast";



const DesktopLayout: React.FC = () => {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Función para navegar a contactos
  const handleNewConversation = () => {
    navigate('/app/contacts');
  };
  const { user } = useAuthStore();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Obtener conversaciones usando el hook
   const { data: conversationsData, isLoading: conversationsLoading, error: conversationsError } = useConversations();
   const conversations = conversationsData?.conversations || [];
   
   // Obtener mensajes de la conversación seleccionada
   const { data: messagesData, isLoading: messagesLoading } = useMessages(selectedChat || '', 1, 50);
   const messages = messagesData?.messages || [];
   
   // Función para enviar mensajes (comentada: no se usa)
   // const sendMessage = async (content: string) => {
   //   // Implementación básica de envío
   //   return { success: true }
   // }
   // const isSendingHttp = false
   
   // Hook para Socket.IO en tiempo real
   const { 
     socket,
     isConnected,
     joinConversation,
     leaveConversation,
     sendMessage: socketSendMessage,
     ackDelivered,
     markRead
   } = useChatSocket();
   
   // Hook para auto-scroll
   const {
    messagesContainerRef,
    messagesEndRef,
    isAutoScrollEnabled,
    setAutoScrollEnabled,
    scrollToBottom,
    handleScroll
  } = useAutoScroll([messages], {
     threshold: 50
   });
   
  // Función para obtener conversación por ID
  const getConversationById = (id: string) => conversations.find((c: any) => c.id === id);
  
  // Detectar si se viene de contactos con una conversación específica
  useEffect(() => {
    const conversationParam = searchParams.get('conversation');
    const stateConversationId = location.state?.selectedConversationId;
    const autoSelect = location.state?.autoSelectConversation;
    
    
    if (conversationParam) {
      if (conversations.length > 0) {
        // Verificar que la conversación existe
        const conversation = getConversationById(conversationParam);
        if (conversation) {
          setSelectedChat(conversationParam);
          // Limpiar los parámetros de la URL después de seleccionar
          window.history.replaceState({}, '', '/app');
        } else {
          // La conversación no está en la lista, pero puede ser recién creada
          setSelectedChat(conversationParam);
          window.history.replaceState({}, '', '/app');
        }
      } else if (!conversationsLoading) {
        setSelectedChat(conversationParam);
        window.history.replaceState({}, '', '/app');
      }
    } else if (stateConversationId) {
      if (autoSelect) {
        // Es una conversación recién creada desde contactos
        setSelectedChat(stateConversationId);
        // Limpiar el state después de usar
        window.history.replaceState({}, '', '/app');
      } else if (conversations.length > 0) {
        const conversation = getConversationById(stateConversationId);
        if (conversation) {
          setSelectedChat(stateConversationId);
        }
      }
    }
  }, [searchParams, location.state, conversations, conversationsLoading]);
  
  // Unirse a la conversación seleccionada
   useEffect(() => {
     if (selectedChat && isConnected) {
       joinConversation(selectedChat);
       return () => {
         leaveConversation(selectedChat);
       };
     }
   }, [selectedChat, isConnected]);
   
   // El hook useChatSocket ya maneja los eventos 'message:new' correctamente
   // Solo necesitamos hacer scroll cuando lleguen mensajes nuevos
   useEffect(() => {
     if (!socket) return;

     const handleNewMessage = (message: any) => {
       // Si el mensaje no es del usuario actual, confirmar entrega automáticamente
       if (message.sender_id !== user?.id) {
         ackDelivered(message.id, message.conversation_id);
       }
       // Hacer scroll al final si está habilitado el auto-scroll
       if (isAutoScrollEnabled) {
         setTimeout(() => {
           scrollToBottom();
         }, 100);
       }
     };

     const handleMessageRead = (_data: any) => {
       // Los ticks se actualizarán automáticamente porque useChatSocket 
       // ya actualiza el cache de TanStack Query con el nuevo estado
     };

     socket.on('message:new', handleNewMessage);
     socket.on('message:read', handleMessageRead);

     return () => {
       socket.off('message:new', handleNewMessage);
       socket.off('message:read', handleMessageRead);
     };
   }, [socket, user?.id, ackDelivered, isAutoScrollEnabled, scrollToBottom]);

   // Marcar mensajes como leídos al abrir la conversación
   useEffect(() => {
     if (messages && user?.id && selectedChat) {
       const unreadMessages = messages.filter((m: any) => !m.is_read && m.sender_id !== user.id);
       if (unreadMessages.length > 0) {
         unreadMessages.forEach((message: any) => {
           markRead(message.id, selectedChat);
         });
       }
     }
   }, [messages, user?.id, selectedChat, markRead]);

   // Intersection Observer para marcar mensajes como leídos cuando entran en viewport
   useEffect(() => {
     if (!messages || !messagesContainerRef.current || !selectedChat) return;

     const observer = new IntersectionObserver(
       (entries) => {
         entries.forEach((entry) => {
           if (entry.isIntersecting) {
             const messageElement = entry.target as HTMLElement;
             const messageId = messageElement.dataset.messageId;
             const senderId = messageElement.dataset.senderId;
             
             // Solo marcar como leído si no es del usuario actual y no está ya leído
             if (messageId && senderId !== user?.id) {
               const message = messages.find((m: any) => m.id === messageId);
               if (message && !message.is_read) {
                 markRead(messageId, selectedChat);
               }
             }
           }
         });
       },
       {
         root: messagesContainerRef.current,
         rootMargin: '0px',
         threshold: 0.5, // 50% del mensaje debe ser visible
       }
     );

     // Observar todos los mensajes de otros usuarios
     const messageElements = messagesContainerRef.current.querySelectorAll('[data-message-id]');
     messageElements.forEach((element) => {
       const senderId = (element as HTMLElement).dataset.senderId;
       if (senderId !== user?.id) {
         observer.observe(element);
       }
     });

     return () => {
       observer.disconnect();
     };
   }, [messages, user?.id, selectedChat, markRead]);
   
  // Función para manejar el envío de mensajes usando Socket.IO
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isSending || !isConnected || !selectedChat) {
      return;
    }

     const content = message.trim();
     setMessage('');
     setIsSending(true);

     try {
       await socketSendMessage(
         {
           conversation_id: selectedChat,
           content,
           message_type: 'text'
         },
         {
           onOptimistic: (_tempMessage) => {
             // El mensaje optimista ya se agrega al cache en useChatSocket
             // Hacer scroll al final
             setTimeout(() => {
               scrollToBottom();
             }, 100);
           }
         }
       );
     } catch (error) {
       console.error('Error enviando mensaje:', error);
       toast.error('Error al enviar el mensaje. Inténtalo de nuevo.');
       // Restaurar el contenido del mensaje en caso de error
       setMessage(content);
     } finally {
       setIsSending(false);
     }
   }, [message, isSending, isConnected, selectedChat, socketSendMessage, scrollToBottom]);

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Sidebar - Conversations */}
      <div className="w-80 border-r border-border/50 bg-card/30 backdrop-blur-sm flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-foreground">Mensajes</h1>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-9 w-9 rounded-full hover:bg-primary/10"
              onClick={handleNewConversation}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar conversaciones..."
              className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 rounded-full"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="overflow-y-auto">
          {conversationsLoading ? (
            <div className="p-4 text-center text-muted-foreground">Cargando conversaciones...</div>
          ) : conversationsError ? (
            <div className="p-4 text-center text-red-500">Error al cargar conversaciones</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No hay conversaciones</div>
          ) : (
            conversations.map((conversation: any) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedChat(conversation.id)}
                className={`w-full p-4 text-left transition-all duration-200 hover:bg-primary/5 border-b border-border/30 ${
                  selectedChat === conversation.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.participant_avatar || ''} alt={conversation.display_name || conversation.name || 'Usuario'} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {(conversation.display_name || conversation.name)?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-foreground truncate">{conversation.display_name || conversation.name || 'Sin nombre'}</h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(conversation.updated_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">Conversación</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border/50 bg-card/30 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getConversationById(selectedChat)?.participant_avatar || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(getConversationById(selectedChat)?.display_name || getConversationById(selectedChat)?.name)?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-foreground">
                      {getConversationById(selectedChat)?.display_name || getConversationById(selectedChat)?.name || 'Sin nombre'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {(() => {
                        const conversation = getConversationById(selectedChat);
                        if (!conversation) return <span className="text-gray-500">● Sin estado</span>;
                        
                        // Para conversaciones 1:1, obtener el estado del otro participante
                        const otherParticipant = conversation.participants?.find((p: any) => p.id !== user?.id);
                        if (otherParticipant) {
                          return otherParticipant.isOnline ? (
                            <span className="text-green-500">● En línea</span>
                          ) : (
                            <span className="text-gray-500">● Desconectado</span>
                          );
                        }
                        
                        // Para grupos, mostrar estado de conexión WebSocket
                        return isConnected ? (
                          <span className="text-green-500">● Conectado</span>
                        ) : (
                          <span className="text-red-500">● Desconectado</span>
                        );
                      })()} 
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
             <div 
               className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-background to-muted/20"
               ref={messagesContainerRef as any}
               onScroll={handleScroll}
             >
               <div className="space-y-4">
                {messagesLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <p className="text-muted-foreground">Cargando mensajes...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex justify-center items-center h-32">
                    <p className="text-muted-foreground">No hay mensajes en esta conversación</p>
                  </div>
                ) : (
                  messages.map((msg: any, index: number) => {
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const showAvatar = !prevMessage || prevMessage.sender_id !== msg.sender_id;
                    const showTimestamp = !prevMessage || 
                      new Date(msg.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 1800000; // 30 minutes



                    return (
                      <div
                        key={msg.id}
                        className="message-wrapper"
                        data-message-id={msg.id}
                        data-sender-id={msg.sender_id}
                      >
                        <MessageItem
                          message={{
                            id: msg.id,
                            content: msg.content,
                            senderId: msg.sender_id,
                            senderName: msg.sender_name || 'Usuario',
                            senderRole: msg.sender_role || 'patient',
                            timestamp: msg.created_at,
                            isRead: msg.is_read || false,
                            status: msg.status,
                            delivered_at: msg.delivered_at,
                            readBy: msg.readBy,
                            deliveryStatus: (() => {
                              // Calcular deliveryStatus basado en los datos del backend
                              const hasBeenReadByOthers = msg.readBy && 
                                Object.keys(msg.readBy).some(userId => userId !== msg.sender_id);
                              
                              if (hasBeenReadByOthers) {
                                return 'read'; // Doble tick azul - leído por otra persona
                              } else if (msg.status === 'delivered' || msg.delivered_at) {
                                return 'delivered'; // Doble tick gris - confirmado por backend
                              } else {
                                return 'sent'; // Tick simple - enviado
                              }
                            })()
                          }}
                          showAvatar={showAvatar}
                          showTimestamp={showTimestamp}
                          isOwn={msg.sender_id === user?.id}
                        />
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef as any} />
                
                {!isAutoScrollEnabled && (
                  <button 
                    className="fixed bottom-24 right-8 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                    onClick={() => {
                      setAutoScrollEnabled(true);
                      scrollToBottom();
                    }}
                    aria-label="Ir al final de la conversación"
                  >
                    <ChevronDown className="h-4 w-4" />
                    <span className="text-sm">Nuevos mensajes</span>
                  </button>
                )}
              </div>
            </div>

            {/* Message Input */}
             <div className="p-4 border-t border-border/50 bg-card/30 backdrop-blur-sm">
               <div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Escribí tu mensaje..."
                        className="pr-20 py-3 rounded-full border-border/50 focus:border-primary/50 bg-background/50"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                          <Smile className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="icon" 
                    className="h-10 w-10 rounded-full shadow-sm"
                    disabled={!message.trim() || isSending}
                    title="Enviar mensaje"
                    onClick={handleSendMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">Mensajería Médica</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Seleccioná una conversación para comenzar a comunicarte de manera segura y eficiente con tu equipo médico.
              </p>
              <Button className="rounded-full px-6" onClick={handleNewConversation}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Conversación
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesktopLayout;
