import { z } from "zod";

// Brand creation schema
export const createBrandSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(40, "Name must not exceed 40 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1024, "Description must not exceed 1024 characters"),
  subCategories: z.array(z.number()).min(1, "At least one subcategory is required"),
});

// Brand update schema
export const updateBrandSchema = createBrandSchema.partial();

// Types inferred from schemas
export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
