import { z } from 'zod';

// Message type enum según esquema de BD
export const MessageTypeEnum = z.enum(['text', 'image', 'file']);

// Message schema completo según estructura de BD
export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  content: z.string().min(1, 'El contenido del mensaje es requerido'),
  message_type: MessageTypeEnum.default('text'),
  is_edited: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Schema para crear mensaje
export const CreateMessageSchema = MessageSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  is_edited: true,
});

// Schema para actualizar mensaje
export const UpdateMessageSchema = z.object({
  content: z.string().min(1, 'El contenido del mensaje es requerido'),
  is_edited: z.boolean().default(true),
});

// Schema para respuesta de mensaje
export const MessageResponseSchema = MessageSchema;

// Schema para message_reads
export const MessageReadSchema = z.object({
  id: z.string().uuid(),
  message_id: z.string().uuid(),
  user_id: z.string().uuid(),
  read_at: z.string().datetime(),
});

// Schema para crear message_read
export const CreateMessageReadSchema = MessageReadSchema.omit({
  id: true,
  read_at: true,
});

// Schema para búsqueda de mensajes
export const MessageSearchParamsSchema = z.object({
  conversation_id: z.string().uuid(),
  search: z.string().optional(),
  message_type: MessageTypeEnum.optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  before_date: z.string().datetime().optional(),
  after_date: z.string().datetime().optional(),
});

// Schema para enviar mensaje
export const SendMessageSchema = z.object({
  conversation_id: z.string().uuid().nullable(),
  recipient_id: z.string().uuid().optional(),
  content: z.string().min(1, 'El contenido del mensaje es requerido').max(2000, 'El mensaje no puede exceder 2000 caracteres'),
  message_type: MessageTypeEnum.default('text'),
}).refine((data) => {
  // Si conversation_id es null, recipient_id debe estar presente
  if (data.conversation_id === null && !data.recipient_id) {
    return false;
  }
  return true;
}, {
  message: 'Si conversation_id es null, recipient_id es requerido',
  path: ['recipient_id']
});

// Tipos exportados
export type Message = z.infer<typeof MessageSchema>;
export type CreateMessage = z.infer<typeof CreateMessageSchema>;
export type UpdateMessage = z.infer<typeof UpdateMessageSchema>;
export type MessageResponse = z.infer<typeof MessageResponseSchema>;
export type MessageRead = z.infer<typeof MessageReadSchema>;
export type CreateMessageRead = z.infer<typeof CreateMessageReadSchema>;
export type MessageSearchParams = z.infer<typeof MessageSearchParamsSchema>;
export type SendMessage = z.infer<typeof SendMessageSchema>;
export type MessageType = z.infer<typeof MessageTypeEnum>;