import React, { useMemo } from 'react';
import { useAutoScroll } from './hooks/useAutoScroll';
import { groupMessagesByDay, shouldShowTimestamp } from './utils/dateUtils';
import { DateSeparator } from './DateSeparator';
import { MessageItem } from './MessageItem';
import './DateSeparator.css';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: 'doctor' | 'nurse' | 'admin' | 'patient';
  timestamp: string;
  isRead: boolean;
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'failed';
  isOptimistic?: boolean;
}

interface MessageContainerProps {
  /** Array de mensajes a mostrar */
  messages: Message[];
  /** ID del usuario actual */
  currentUserId: string;
  /** ID de la conversación actual */
  conversationId: string;
  /** Si está cargando más mensajes */
  isLoading?: boolean;
  /** Callback cuando se hace scroll al inicio (para paginación) */
  onScrollToTop?: () => void;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Contenedor de mensajes con auto-scroll, separadores de fecha y accesibilidad
 */
export const MessageContainer: React.FC<MessageContainerProps> = ({
  messages,
  currentUserId,
  conversationId,
  isLoading = false,
  onScrollToTop,
  className = ''
}) => {
  // Hook de auto-scroll que se activa cuando cambian los mensajes o la conversación
  const {
    messagesContainerRef,
    messagesEndRef,
    isAutoScrollEnabled,
    setAutoScrollEnabled,
    // scrollToBottom, // Comentado: no se usa
    handleScroll
  } = useAutoScroll(
    [messages, conversationId], // Dependencias que triggean el scroll
    {
      threshold: 100,
      behavior: 'smooth',
      scrollOnMount: true
    }
  );

  // Agrupar mensajes por día y agregar separadores
  const messagesWithSeparators = useMemo(() => {
    return groupMessagesByDay(messages);
  }, [messages]);

  // Manejar scroll con detección de scroll al inicio para paginación
  const handleContainerScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop } = messagesContainerRef.current;
    
    // Si está cerca del inicio y hay callback, ejecutarlo
    if (scrollTop < 100 && onScrollToTop && !isLoading) {
      onScrollToTop();
    }
    
    // Manejar auto-scroll
    handleScroll();
  };

  return (
    <div className={`message-container ${className}`}>
      {/* Contenedor de mensajes con aria-live para accesibilidad */}
      <div
        ref={messagesContainerRef as React.RefObject<HTMLDivElement>}
        className="messages-scroll-container"
        onScroll={handleContainerScroll}
        aria-live="polite"
        aria-label="Lista de mensajes"
        role="log"
      >
        {/* Indicador de carga al inicio */}
        {isLoading && (
          <div className="loading-indicator" aria-label="Cargando mensajes anteriores">
            <div className="loading-spinner" />
            <span>Cargando mensajes...</span>
          </div>
        )}

        {/* Mensajes y separadores */}
        <div className="messages-list">
          {messagesWithSeparators.map((item, index) => {
            // Si es un separador de fecha
            if ('type' in item && item.type === 'date-separator') {
              return (
                <DateSeparator
                  key={item.id}
                  date={item.date}
                  className="message-date-separator"
                />
              );
            }

            // Si es un mensaje
            const message = item as Message;
            const prevMessage = index > 0 ? messagesWithSeparators[index - 1] : null;
            const prevMessageData = prevMessage && 'content' in prevMessage ? prevMessage as Message : null;
            
            // Determinar si mostrar avatar y timestamp
            const showAvatar = !prevMessageData || prevMessageData.senderId !== message.senderId;
            const showTimestamp = shouldShowTimestamp(
              message.timestamp,
              prevMessageData?.timestamp
            );

            return (
              <div
                key={message.id}
                className={`message-wrapper ${
                  message.senderId === currentUserId ? 'own-message' : 'other-message'
                }`}
                data-message-id={message.id}
                data-sender-id={message.senderId}
              >
                <MessageItem
                  message={message}
                  showAvatar={showAvatar}
                  showTimestamp={showTimestamp}
                  isOwn={message.senderId === currentUserId}
                />
              </div>
            );
          })}
        </div>

        {/* Elemento al final para el auto-scroll */}
        <div ref={messagesEndRef as React.RefObject<HTMLDivElement>} className="messages-end" />
      </div>

      {/* Botón para volver al final cuando no está en auto-scroll */}
      {!isAutoScrollEnabled && (
        <button
          className="scroll-to-bottom-button"
          onClick={() => setAutoScrollEnabled(true)}
          aria-label="Ir al final de la conversación"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path 
              d="M7 14l5 5 5-5" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <span>Nuevos mensajes</span>
        </button>
      )}
    </div>
  );
};

export default MessageContainer;