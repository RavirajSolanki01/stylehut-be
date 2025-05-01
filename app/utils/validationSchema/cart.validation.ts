import { z } from 'zod';

export const addToCartSchema = z.object({
  product_id: z.number({
    required_error: "Product ID is required"
  }).positive("Product ID must be positive"),
  quantity: z.number({
    required_error: "Quantity is required"
  }).min(1, "Quantity must be at least 1"),
  size: z.string().optional(),
  color: z.string().optional(),
});

export const updateCartSchema = z.object({
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

export const cartQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  pageSize: z.string().optional().transform(val => parseInt(val || '10')),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartInput = z.infer<typeof updateCartSchema>;
export type CartQueryInput = z.infer<typeof cartQuerySchema>;