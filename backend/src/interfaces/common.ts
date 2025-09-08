import { Request } from 'express';

// Interfaces comunes para respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string | any;
  };
}

// Interface para requests autenticados
export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string;
  };
}

// Tipos de error comunes
export type ErrorCode = 
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_DATA'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR'
  | 'VALIDATION_ERROR'
  | 'DUPLICATE_ENTRY'
  | 'UPDATE_FAILED'
  | 'DELETE_FAILED'
  | 'USER_OFFLINE'
  | 'PARTICIPANTS_OFFLINE'
  | 'INVALID_STATE';

// Interface para paginación
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}