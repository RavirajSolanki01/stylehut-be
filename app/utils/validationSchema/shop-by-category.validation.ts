import { z } from "zod";

export const createShopByCategorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(40, "Name must not exceed 40 characters"),
    minDiscount: z
      .number()
      .int("MinDiscount must be an integer")
      .min(0, "MinDiscount cannot be negative")
      .max(100, "MinDiscount cannot exceed 100%"),
    maxDiscount: z
      .number()
      .int("MaxDiscount must be an integer")
      .min(0, "MaxDiscount cannot be negative")
      .max(100, "MaxDiscount cannot exceed 100%")
      .optional(),
    sub_category_id: z
      .number()
      .int("Sub-category ID must be an integer")
      .positive("Sub-category ID must be positive"),
    images: z.array(z.object({})),
  })

  // ✅ Cross-field validation: minDiscount <= maxDiscount
  .refine(
    data =>
      data.minDiscount === undefined ||
      data.maxDiscount === undefined ||
      data.minDiscount < data.maxDiscount,
    {
      message: "minDiscount must be less than maxDiscount",
      path: ["minDiscount"], // error will appear under minDiscount field
    }
  );

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
  minPrice: z
    .string()
    .optional()
    .transform(val => parseFloat(val || "0")),
  maxPrice: z
    .string()
    .optional()
    .transform(val => parseFloat(val || "0")),
});

// Types inferred from schemas
export type CreateShopByCategoryInput = z.infer<typeof createShopByCategorySchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
