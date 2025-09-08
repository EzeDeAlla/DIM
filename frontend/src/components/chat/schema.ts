import { z } from 'zod';

// Schema para login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rememberMe: z.boolean().optional().default(false)
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Schema para perfil de usuario
export const profileSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido'),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[+]?[0-9\s\-\(\)]{10,}$/.test(val), {
      message: 'Formato de teléfono inválido'
    }),
  specialization: z
    .string()
    .optional(),
  bio: z
    .string()
    .max(500, 'La biografía no puede exceder 500 caracteres')
    .optional(),
  avatar: z
    .string()
    .optional()
    .refine((val) => !val || val === '' || /^https?:\/\/.+/.test(val), {
      message: 'URL de avatar inválida'
    })
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// Schema para mensajes
export const messageSchema = z.object({
  content: z
    .string()
    .min(1, 'El mensaje no puede estar vacío')
    .max(2000, 'El mensaje no puede exceder 2000 caracteres')
    .refine((val) => val.trim().length > 0, {
      message: 'El mensaje no puede contener solo espacios en blanco'
    }),
  conversationId: z
    .string()
    .min(1, 'ID de conversación requerido'),
  replyToId: z
    .string()
    .optional(),
  attachments: z
    .array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      size: z.number(),
      url: z.string().url()
    }))
    .optional()
    .default([])
});

export type MessageFormData = z.infer<typeof messageSchema>;

// Schema para búsqueda de contactos
export const contactSearchSchema = z.object({
  query: z
    .string()
    .min(1, 'Ingrese un término de búsqueda')
    .max(100, 'La búsqueda no puede exceder 100 caracteres'),
  role: z
    .string()
    .refine((val) => ['doctor', 'admin', 'administrador', 'all'].includes(val), {
      message: 'Rol inválido'
    })
    .optional()
    .default('all'),
  isOnline: z
    .boolean()
    .optional()
});

export type ContactSearchFormData = z.infer<typeof contactSearchSchema>;

// Schema para crear nueva conversación
export const createConversationSchema = z.object({
  participantIds: z
    .array(z.string())
    .min(1, 'Debe seleccionar al menos un participante')
    .max(10, 'No puede agregar más de 10 participantes'),
  title: z
    .string()
    .max(100, 'El título no puede exceder 100 caracteres')
    .optional(),
  isGroup: z
    .boolean()
    .default(false)
});

export type CreateConversationFormData = z.infer<typeof createConversationSchema>;

// Schema para configuraciones de chat
export const chatSettingsSchema = z.object({
  notifications: z.object({
    enabled: z.boolean().default(true),
    sound: z.boolean().default(true),
    desktop: z.boolean().default(true),
    email: z.boolean().default(false)
  }),
  privacy: z.object({
    readReceipts: z.boolean().default(true),
    onlineStatus: z.boolean().default(true),
    lastSeen: z.boolean().default(true)
  }),
  appearance: z.object({
    theme: z.string().refine((val) => ['light', 'dark', 'system'].includes(val), {
      message: 'Tema inválido'
    }).default('system'),
    fontSize: z.string().refine((val) => ['small', 'medium', 'large'].includes(val), {
      message: 'Tamaño de fuente inválido'
    }).default('medium'),
    compactMode: z.boolean().default(false)
  })
});

export type ChatSettingsFormData = z.infer<typeof chatSettingsSchema>;

// Validadores auxiliares
export const validateFileUpload = (file: File) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (file.size > maxSize) {
    throw new Error('El archivo no puede exceder 10MB');
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido');
  }

  return true;
};

// Validador para menciones en mensajes
export const validateMentions = (content: string, availableUsers: string[]) => {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions = content.match(mentionRegex);
  
  if (!mentions) return true;
  
  const invalidMentions = mentions
    .map(mention => mention.substring(1)) // Remover @
    .filter(username => !availableUsers.includes(username));
  
  if (invalidMentions.length > 0) {
    throw new Error(`Usuarios no encontrados: ${invalidMentions.join(', ')}`);
  }
  
  return true;
};