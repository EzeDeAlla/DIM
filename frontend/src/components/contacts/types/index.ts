import { z } from 'zod';

export const contactFilterSchema = z.object({
  userType: z.enum(['DOCTOR', 'ADMIN', 'ALL']).default('ALL'),
  searchTerm: z.string().default('')
});

export type ContactFilter = z.infer<typeof contactFilterSchema>;

export interface ContactListProps {
  onStartConversation: (userId: number) => void;
}
