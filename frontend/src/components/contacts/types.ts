import { z } from 'zod';

export const contactFilterSchema = z.object({
  userType: z.enum(['DOCTOR', 'ADMIN', 'ALL']).default('ALL'),
  searchTerm: z.string().default(''),
  showOnlineOnly: z.boolean().default(false)
});

export type ContactFilter = z.infer<typeof contactFilterSchema>;

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  user_type: string;
  avatar_url?: string;
  email: string;
  is_online?: boolean;
  specialty?: string;
  description?: string;
  last_online_at?: string;
}
