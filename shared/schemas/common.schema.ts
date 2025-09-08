import { z } from 'zod';

// Common API Response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

export const ApiErrorSchema = ApiResponseSchema.extend({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.string().optional(),
  }),
});

export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  ApiResponseSchema.extend({
    success: z.literal(true),
    data: dataSchema,
  });

// Pagination schemas
export const PaginationParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const PaginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });

// Health check schema
export const HealthCheckSchema = z.object({
  status: z.enum(['OK', 'ERROR']),
  timestamp: z.string().datetime(),
  uptime: z.number(),
  version: z.string().optional(),
});

// Generic types
export type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  timestamp?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
};

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type HealthCheck = z.infer<typeof HealthCheckSchema>;