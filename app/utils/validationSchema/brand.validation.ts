import { z } from 'zod';

// Brand creation schema
export const createBrandSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(30, 'Name must not exceed 30 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(100, 'Description must not exceed 100 characters'),
});

// Brand update schema
export const updateBrandSchema = createBrandSchema.partial();

// Types inferred from schemas
export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;