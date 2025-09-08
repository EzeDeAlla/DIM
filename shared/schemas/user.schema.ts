import { z } from 'zod';

// User type enum según esquema de BD
export const UserTypeEnum = z.enum(['doctor', 'admin', 'administrador']);

// User schema completo según estructura de BD
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email('Formato de email inválido'),
  password_hash: z.string(),
  first_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'El nombre no puede exceder 50 caracteres'),
  last_name: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').max(50, 'El apellido no puede exceder 50 caracteres'),
  avatar_url: z.string().nullable().optional(),
  description: z.string().max(500, 'La descripción no puede exceder 500 caracteres').nullable().optional(),
  user_type: UserTypeEnum,
  specialty: z.string().max(100, 'La especialidad no puede exceder 100 caracteres').nullable().optional(),
  is_active: z.boolean().default(true),
  is_online: z.boolean().default(false),
  last_online_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Schema para crear usuario
export const CreateUserSchema = UserSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

// Schema para actualizar usuario
export const UpdateUserSchema = CreateUserSchema.partial().omit({ password_hash: true });

// Schema para respuesta de usuario (sin password_hash)
export const UserResponseSchema = UserSchema.omit({ password_hash: true });

// Schema para búsqueda de contactos
export const ContactSearchParamsSchema = z.object({
  search: z.string().optional(),
  user_type: UserTypeEnum.optional(),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
});

// Schema para actualizar avatar
export const UpdateAvatarSchema = z.object({
  avatar_url: z.string().url('URL de avatar inválida'),
});

// Schema para actualizar perfil de usuario
export const UpdateProfileSchema = z.object({
  first_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'El nombre no puede exceder 50 caracteres').optional(),
  last_name: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').max(50, 'El apellido no puede exceder 50 caracteres').optional(),
  description: z.string().max(500, 'La descripción no puede exceder 500 caracteres').optional(),
  specialty: z.string().max(100, 'La especialidad no puede exceder 100 caracteres').optional(),
});

// Schema para crear usuario por admin
export const CreateUserByAdminSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  first_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'El nombre no puede exceder 50 caracteres'),
  last_name: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').max(50, 'El apellido no puede exceder 50 caracteres'),
  user_type: UserTypeEnum,
  specialty: z.string().max(100, 'La especialidad no puede exceder 100 caracteres').optional(),
  description: z.string().max(500, 'La descripción no puede exceder 500 caracteres').optional(),
  is_active: z.boolean().default(true),
});

// Inferred types
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type ContactSearchParams = z.infer<typeof ContactSearchParamsSchema>;
export type UpdateAvatar = z.infer<typeof UpdateAvatarSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export type CreateUserByAdmin = z.infer<typeof CreateUserByAdminSchema>;
export type UserType = z.infer<typeof UserTypeEnum>;

// API Response schemas
export const UsersListResponseSchema = z.object({
  users: z.array(UserResponseSchema),
  total: z.number(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export type UsersListResponse = z.infer<typeof UsersListResponseSchema>;