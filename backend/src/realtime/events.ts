// Eventos de Socket.IO para el sistema de mensajería en tiempo real

// Eventos del Cliente al Servidor
export const CLIENT_EVENTS = {
  CONVERSATION_JOIN: 'conversation:join',
  CONVERSATION_LEAVE: 'conversation:leave',
  MESSAGE_SEND: 'message:send',
  MESSAGE_ACK_DELIVERED: 'message:ackDelivered',
  MESSAGE_MARK_READ: 'message:markRead',
} as const;

// Eventos del Servidor al Cliente
export const SERVER_EVENTS = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_READ: 'message:read',
  CONVERSATION_CREATED: 'conversation:created',
  CONVERSATION_UPDATED: 'conversation:updated',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
} as const;

// Tipos para los eventos
export type ClientEvents = typeof CLIENT_EVENTS[keyof typeof CLIENT_EVENTS];
export type ServerEvents = typeof SERVER_EVENTS[keyof typeof SERVER_EVENTS];

// Helpers para generar nombres de rooms
export const ROOM_NAMES = {
  user: (userId: string) => `user:${userId}`,
  conversation: (conversationId: string) => `conversation:${conversationId}`,
} as const;