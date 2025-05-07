import { z } from 'zod';

export const createRatingSchema = z.object({
  product_id: z.number({
    required_error: "Product ID is required",
  }).positive("Product ID must be positive"),
  ratings: z.number({
    required_error: "Rating is required",
  }).min(1, "Rating must be at least 1")
    .max(5, "Rating must not exceed 5"),
  description: z.string({
    required_error: "Description is required",
  }).min(10, "Description must be at least 10 characters")
    .max(1024, "Description must not exceed 1024 characters"),
  images: z.array(z.any()).optional(),
});

export const updateRatingSchema = createRatingSchema.partial();

export type CreateRatingInput = z.infer<typeof createRatingSchema>;
export type UpdateRatingInput = z.infer<typeof updateRatingSchema>;

export const ratingQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  pageSize: z.string().optional().transform(val => parseInt(val || '10')),
  search: z.string().optional(),
  product_id: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  user_id: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  minRating: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  maxRating: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export type RatingQueryInput = z.infer<typeof ratingQuerySchema>;