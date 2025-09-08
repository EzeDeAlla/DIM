import { z } from 'zod';

// Schemas para eventos de Socket.IO

// Eventos del cliente al servidor
export const ConversationJoinSchema = z.object({
  conversation_id: z.string().uuid(),
});

export const ConversationLeaveSchema = z.object({
  conversation_id: z.string().uuid(),
});

export const MessageSendSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1, 'El contenido del mensaje es requerido'),
  message_type: z.enum(['text', 'image', 'file', 'audio']).default('text'),
});

export const MessageAckDeliveredSchema = z.object({
  message_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
});

export const MessageMarkReadSchema = z.object({
  message_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
});

// Eventos del servidor al cliente
export const MessageNewSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  content: z.string(),
  message_type: z.enum(['text', 'image', 'file', 'audio']),
  created_at: z.string().datetime(),
  sender: z.object({
    id: z.string().uuid(),
    first_name: z.string(),
    last_name: z.string(),
    avatar_url: z.string().nullable().optional(),
  }),
});

export const MessageDeliveredSchema = z.object({
  message_id: z.string().uuid(),
  user_id: z.string().uuid(),
  delivered_at: z.string().datetime(),
});

export const MessageReadEventSchema = z.object({
  message_id: z.string().uuid(),
  user_id: z.string().uuid(),
  read_at: z.string().datetime(),
});

export const UserOnlineSchema = z.object({
  userId: z.string().uuid(),
  timestamp: z.string().datetime(),
});

export const UserOfflineSchema = z.object({
  userId: z.string().uuid(),
  timestamp: z.string().datetime(),
});

export const ConversationCreatedSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable().optional(),
  is_group: z.boolean(),
  created_at: z.string().datetime(),
  participants: z.array(z.object({
    user_id: z.string().uuid(),
    joined_at: z.string().datetime(),
  })),
});

export const ConversationUpdatedSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable().optional(),
  updated_at: z.string().datetime(),
});

// Tipos inferidos
export type ConversationJoin = z.infer<typeof ConversationJoinSchema>;
export type ConversationLeave = z.infer<typeof ConversationLeaveSchema>;
export type MessageSend = z.infer<typeof MessageSendSchema>;
export type MessageAckDelivered = z.infer<typeof MessageAckDeliveredSchema>;
export type MessageMarkRead = z.infer<typeof MessageMarkReadSchema>;

export type MessageNew = z.infer<typeof MessageNewSchema>;
export type MessageDelivered = z.infer<typeof MessageDeliveredSchema>;
export type MessageReadEvent = z.infer<typeof MessageReadEventSchema>;
export type UserOnline = z.infer<typeof UserOnlineSchema>;
export type UserOffline = z.infer<typeof UserOfflineSchema>;
export type ConversationCreated = z.infer<typeof ConversationCreatedSchema>;
export type ConversationUpdated = z.infer<typeof ConversationUpdatedSchema>;

// Schema para respuesta de acknowledgment
export const MessageSendAckSchema = z.object({
  success: z.boolean(),
  message: MessageNewSchema.optional(),
  error: z.string().optional(),
});

export type MessageSendAck = z.infer<typeof MessageSendAckSchema>;