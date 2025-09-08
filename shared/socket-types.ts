import { z } from 'zod';
import { 
  MessageSchema, 
  SendMessageSchema,
  type Message,
  type SendMessage 
} from './schemas/message.schema';
import { 
  ConversationSchema,
  type Conversation 
} from './schemas/conversation.schema';

// DTOs derivados de los schemas de Zod
export type MessageDTO = z.infer<typeof MessageSchema>;
export type MessageSendDTO = z.infer<typeof SendMessageSchema>;
export type ConversationDTO = z.infer<typeof ConversationSchema>;

// Eventos del cliente al servidor
export interface ClientToServerEvents {
  /**
   * Unirse a una conversación específica
   * @param conversationId - ID de la conversación
   */
  'conversation:join': (conversationId: string) => void;
  
  /**
   * Salir de una conversación específica
   * @param conversationId - ID de la conversación
   */
  'conversation:leave': (conversationId: string) => void;
  
  /**
   * Enviar un mensaje
   * @param payload - Datos del mensaje a enviar
   * @param ack - Callback de acknowledgment con el mensaje creado
   */
  'message:send': (
    payload: MessageSendDTO, 
    ack: (response: { success: boolean; message?: MessageDTO; error?: string }) => void
  ) => void;
  
  /**
   * Confirmar entrega de mensaje (no persiste, solo reemite)
   * @param payload - ID del mensaje y conversación
   */
  'message:ackDelivered': (payload: {
    message_id: string;
    conversation_id: string;
  }) => void;
  
  /**
   * Marcar mensaje como leído (persiste en BD)
   * @param payload - ID del mensaje y conversación
   */
  'message:markRead': (payload: {
    message_id: string;
    conversation_id: string;
  }) => void;
}

// Eventos del servidor al cliente
export interface ServerToClientEvents {
  /**
   * Nuevo mensaje recibido
   * @param message - Datos completos del mensaje
   */
  'message:new': (message: MessageDTO) => void;
  
  /**
   * Confirmación de entrega de mensaje (efímero)
   * @param payload - Datos de entrega
   */
  'message:delivered': (payload: {
    message_id: string;
    user_id: string;
    delivered_at: string;
  }) => void;
  
  /**
   * Confirmación de lectura de mensaje (persistente)
   * @param payload - Datos de lectura
   */
  'message:read': (payload: {
    message_id: string;
    user_id: string;
    read_at: string;
  }) => void;
  
  /**
   * Nueva conversación creada
   * @param conversation - Datos de la conversación
   */
  'conversation:created': (conversation: ConversationDTO) => void;
  
  /**
   * Conversación actualizada
   * @param conversation - Datos actualizados de la conversación
   */
  'conversation:updated': (conversation: ConversationDTO) => void;
  
  /**
   * Usuario conectado
   * @param userId - ID del usuario que se conectó
   */
  'user:online': (userId: string) => void;
  
  /**
   * Usuario desconectado
   * @param userId - ID del usuario que se desconectó
   */
  'user:offline': (userId: string) => void;
}

// Eventos inter-servidor (para escalabilidad futura)
export interface InterServerEvents {
  ping: () => void;
}

// Datos del socket (información de sesión)
export interface SocketData {
  userId: string;
  sessionId: string;
}

// Tipos de utilidad para Socket.IO
export type SocketEventNames = keyof (ClientToServerEvents & ServerToClientEvents);

// Payload types para eventos específicos
export type MessageDeliveredPayload = Parameters<ServerToClientEvents['message:delivered']>[0];
export type MessageReadPayload = Parameters<ServerToClientEvents['message:read']>[0];
export type MessageAckDeliveredPayload = Parameters<ClientToServerEvents['message:ackDelivered']>[0];
export type MessageMarkReadPayload = Parameters<ClientToServerEvents['message:markRead']>[0];

// Re-exportar tipos principales para conveniencia
export type { Message, SendMessage, Conversation } from './schemas';