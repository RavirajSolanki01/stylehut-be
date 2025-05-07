import { z } from 'zod';

export const createGenderSchema = z.object({
  name: z.string({
    required_error: "Name is required",
  })
    .min(2, "Name must be at least 2 characters")
    .max(40, 'Name must not exceed 40 characters'),
});

export const updateGenderSchema = createGenderSchema.partial();

export type CreateGenderInput = z.infer<typeof createGenderSchema>;
export type UpdateGenderInput = z.infer<typeof updateGenderSchema>;