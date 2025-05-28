import { z } from 'zod';

export const addToCartSchema = z.object({
  product_id: z.number({
    required_error: "Product ID is required"
  }).positive("Product ID must be positive"),
  quantity: z.number({
    required_error: "Quantity is required"
  }).min(1, "Quantity must be at least 1"),
  size_quantity_id: z.number(),
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

export const addWishlistToCartSchema = z.object({
  product_ids: z.array(z.object({
    id: z.number({
      required_error: "Product ID is required"
    }).positive("Product ID must be positive"),
    size_quantity_id: z.number({
      required_error: "Size is required"
    }).min(1, "Size must be at least 1"),
  })).min(1, "Select at least one product")
});

export type AddWishlistToCartInput = z.infer<typeof addWishlistToCartSchema>;

export const cartToWishlistSchema = z.object({
  product_ids: z.array(z.number()).min(1, "Select at least one product")
});

export type CartToWishlistInput = z.infer<typeof cartToWishlistSchema>;

export const removeFromCartSchema = z.object({
  product_ids: z.array(z.number()).min(1, "Select at least one product")
});

export type RemoveFromCartInput = z.infer<typeof removeFromCartSchema>;