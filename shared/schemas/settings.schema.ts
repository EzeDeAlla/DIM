import { z } from "zod";

export const AppSettingsSchema = z.object({
  read_receipts_enabled: z.boolean().default(true),
  avatar_max_size_mb: z.number().int().positive().max(20).default(5),
  allowed_avatar_mime_types: z.array(z.enum(["image/jpeg", "image/png", "image/webp"])).default(["image/jpeg", "image/png", "image/webp"]),
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;

// Validadores por clave para PUT /settings/:key
export const APP_SETTINGS_KEYS = {
  read_receipts_enabled: z.boolean(),
  avatar_max_size_mb: z.number().int().positive().max(20),
  allowed_avatar_mime_types: z.array(z.string()),
} as const;

export type AppSettingKey = keyof typeof APP_SETTINGS_KEYS;

export const DEFAULT_APP_SETTINGS: AppSettings = AppSettingsSchema.parse({});