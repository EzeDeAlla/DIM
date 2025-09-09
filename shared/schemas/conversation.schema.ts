import { z } from 'zod';

// Conversation schema completo según estructura de BD
export const ConversationSchema = z.object({
  id: z.string().uuid(),
  created_by: z.string().uuid(),
  is_group: z.boolean().default(false),
  title: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Schema para crear conversación
export const CreateConversationSchema = ConversationSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  participant_ids: z.array(z.string().uuid()).optional().default([]),
});

// Schema para actualizar conversación
export const UpdateConversationSchema = CreateConversationSchema.partial();

// Schema para respuesta de conversación
export const ConversationResponseSchema = ConversationSchema;

// Schema para participantes de conversación
export const ConversationParticipantSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  user_id: z.string().uuid(),
  joined_at: z.string().datetime(),
  left_at: z.string().datetime().nullable().optional(),
});

// Schema para crear participante
export const CreateConversationParticipantSchema = ConversationParticipantSchema.omit({
  id: true,
  joined_at: true,
});

// Schema para búsqueda de conversaciones
export const ConversationSearchParamsSchema = z.object({
  search: z.string().optional(),
  is_group: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
});

// Tipos exportados
export type Conversation = z.infer<typeof ConversationSchema>;
export type CreateConversation = z.infer<typeof CreateConversationSchema>;
export type UpdateConversation = z.infer<typeof UpdateConversationSchema>;
export type ConversationResponse = z.infer<typeof ConversationResponseSchema>;
export type ConversationParticipant = z.infer<typeof ConversationParticipantSchema>;
export type CreateConversationParticipant = z.infer<typeof CreateConversationParticipantSchema>;
export type ConversationSearchParams = z.infer<typeof ConversationSearchParamsSchema>;