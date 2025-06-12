import { z } from "zod";

// Product creation schema
export const createProductSchema = z.object({
  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(40, "Name must not exceed 40 characters"),
  description: z
    .string()
    .min(1, "Description must be at least 10 characters")
    .max(1024, "Description must not exceed 1024 characters"),
  price: z
    .number()
    .positive("Price must be a positive number")
    .min(0.01, "Price must be at least 0.01"),
  discount: z
    .number()
    .int("Discount must be an integer")
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100%")
    .optional(),
  // quantity: z.number().int("Quantity must be an integer").min(0, "Quantity cannot be negative"),
  sub_category_type_id: z
    .number()
    .int("Sub-category type ID must be an integer")
    .positive("Sub-category type ID must be positive"),
  brand_id: z.number().int("Brand ID must be an integer").positive("Brand ID must be positive"),
  images: z
    .array(z.object({}))
    .min(1, "At least one image is required")
    .max(5, "Maximum 5 images allowed"),
});

// Product update schema
export const updateProductSchema = createProductSchema.partial();

// Query params schema for product listing
export const productQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => parseInt(val || "1")),
  pageSize: z
    .string()
    .optional()
    .transform(val => parseInt(val || "10")),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
  category_id: z
    .string()
    .optional()
    .transform(val => parseInt(val || "0")),
  sub_category_id: z
    .string()
    .optional()
    .transform(val => parseInt(val || "0")),
  sub_category_type_id: z
    .string()
    .optional()
    .transform(val => parseInt(val || "0")),
  brand_id: z
    .string()
    .optional()
    .transform(val => parseInt(val || "0")),
  minPrice: z
    .string()
    .optional()
    .transform(val => parseFloat(val || "0")),
  maxPrice: z
    .string()
    .optional()
    .transform(val => parseFloat(val || "0")),
  minDiscount: z
    .string()
    .optional()
    .transform(val => parseInt(val || "0")),
  maxDiscount: z
    .string()
    .optional()
    .transform(val => parseInt(val || "100")),
});

// Types inferred from schemas
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
