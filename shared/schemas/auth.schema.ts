import { z } from 'zod';
import { UserTypeEnum, UserResponseSchema } from './user.schema';

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  first_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'El nombre no puede exceder 50 caracteres'),
  last_name: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').max(50, 'El apellido no puede exceder 50 caracteres'),
  user_type: UserTypeEnum,
  specialty: z.string().max(100, 'La especialidad no puede exceder 100 caracteres').optional(),
  description: z.string().max(500, 'La descripción no puede exceder 500 caracteres').optional(),
});

// Schema para respuesta de autenticación
export const AuthResponseSchema = z.object({
  user: UserResponseSchema,
  token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
});

// Schema para refresh token
export const RefreshTokenSchema = z.object({
  refresh_token: z.string(),
});

// Schema para cambio de contraseña
export const ChangePasswordSchema = z.object({
  current_password: z.string().min(8, 'La contraseña actual es requerida'),
  new_password: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

// Schema para reset de contraseña
export const ResetPasswordRequestSchema = z.object({
  email: z.string().email('Formato de email inválido'),
});

export const ResetPasswordSchema = z.object({
  token: z.string(),
  new_password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

// Schema para verificar token
export const VerifyTokenSchema = z.object({
  token: z.string(),
});

// Inferred types
export type LoginCredentials = z.infer<typeof LoginSchema>;
export type RegisterData = z.infer<typeof RegisterSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
export type VerifyToken = z.infer<typeof VerifyTokenSchema>;