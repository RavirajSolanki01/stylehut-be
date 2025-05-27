import { z } from "zod";

// Base brand schema
const baseBrandSchema = {
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(40, "Name must not exceed 40 characters")
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1024, "Description must not exceed 1024 characters")
    .optional(),
};

// Brand creation schema
export const createBrandSchema = z.object({
  ...baseBrandSchema,
  name: baseBrandSchema.name.unwrap(), // Make name required for creation
  description: baseBrandSchema.description.unwrap(), // Make description required for creation
  subCategories: z.array(z.number()).min(1, "At least one subcategory is required"),
});

// Brand update schema
export const updateBrandSchema = z.object({
  ...baseBrandSchema,
  subCategories: z.array(z.number()).min(1, "If provided, at least one subcategory is required").optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
  path: ["name", "description", "subCategories"]
});

// Types inferred from schemas
export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
