import { z } from 'zod';

export const createAddressSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(100),
  phone: z.string().min(10).max(15),
  address_line1: z.string().min(1, "Address is required").max(255),
  address_line2: z.string().optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  postal_code: z.string().min(1, "Postal code is required").max(20),
  is_default: z.boolean().optional().default(false),
  address_type: z.enum(['HOME', 'OFFICE']).default('HOME'),
  is_open_saturday: z.boolean().optional().default(false),
  is_open_sunday: z.boolean().optional().default(false)
});

export const updateAddressSchema = createAddressSchema.partial();

export const addressQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  pageSize: z.string().optional().transform(val => parseInt(val || '10')),
  search: z.string().optional(),
  sortBy: z.string().optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc')
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type AddressQueryInput = z.infer<typeof addressQuerySchema>;