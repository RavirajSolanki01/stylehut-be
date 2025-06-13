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
  category_id: z
    .number()
    .int("Category ID must be an integer")
    .positive("Category ID must be positive"),
  sub_category_id: z
    .number()
    .int("Sub-category ID must be an integer")
    .positive("Sub-category ID must be positive"),
  sub_category_type_id: z
    .number()
    .int("Sub-category type ID must be an integer")
    .positive("Sub-category type ID must be positive"),
  brand_id: z.number().int("Brand ID must be an integer").positive("Brand ID must be positive"),
  images: z
    .array(z.object({}))
    .min(1, "At least one image is required")
    .max(5, "Maximum 5 images allowed")
    .optional(),
  product_additional_details: z
    .array(
      z.object({
        id: z
          .number()
          .int("Additional detail ID must be an integer")
          .positive("Additional detail ID must be positive"),
        value: z.string().min(1, "Additional detail value is required"),
      })
    )
    .min(1, "At least one additional detail is required"),
  product_specifications: z
    .array(
      z.object({
        id: z
          .number()
          .int("Specification ID must be an integer")
          .positive("Specification ID must be positive"),
        value: z.string().min(1, "Specification value is required"),
      })
    )
    .min(1, "At least one specification is required"),
});

export const productSpecificationAdditionalSchema = z.object({
  product_additional_details: z
    .array(
      z.object({
        id: z
          .number()
          .int("Additional detail ID must be an integer")
          .positive("Additional detail ID must be positive"),
        value: z.string().min(1, "Additional detail value is required"),
      })
    )
    .min(1, "At least one additional detail is required"),
  product_specifications: z
    .array(
      z.object({
        id: z
          .number()
          .int("Specification ID must be an integer")
          .positive("Specification ID must be positive"),
        value: z.string().min(1, "Specification value is required"),
      })
    )
    .min(1, "At least one specification is required"),
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

export const productAdditionalCreateSchema = z.object({
  product_article_attributes: z
    .array(z.object({ key: z.string().trim(), value: z.string().trim() }))
    .min(1, "At least one product article attribute is required"),
  product_details: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      type: z.string().optional(),
      content: z.string().optional(),
    })
  ),
});

export const productAdditionalUpdateSchema = z.object({
  product_article_attributes: z.array(z.object({ key: z.string(), value: z.string() })),
  product_details: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      type: z.string().optional(),
      content: z.string().optional(),
    })
  ),
});

export const productAdditionalKeySchema = z.object({
  name: z.string().trim(),
});

export const productSpecificationSchema = z.object({
  name: z.string().trim(),
});

// Types inferred from schemas
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
