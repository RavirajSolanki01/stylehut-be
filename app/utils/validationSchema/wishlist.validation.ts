import { z } from 'zod';

export const createWishlistSchema = z.object({
  product_id: z.number({
    required_error: "Product ID is required"
  }).positive("Product ID must be positive"),
  isSoftAdd: z.boolean().optional(),
});

export const wishlistQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  pageSize: z.string().optional().transform(val => parseInt(val || '10')),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  search: z.string(),
});

export type CreateWishlistInput = z.infer<typeof createWishlistSchema>;
export type WishlistQueryInput = z.infer<typeof wishlistQuerySchema>;