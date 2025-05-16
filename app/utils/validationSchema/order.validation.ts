import { z } from 'zod';
// import { OrderStatus, PaymentStatus, PaymentMethod, ReturnReason } from '@/app/types/order.types'
import { OrderStatus, PaymentMethod, PaymentStatus, ReturnReason } from '@prisma/client';

export const createOrderSchema = z.object({
  shipping_address_id: z.number().positive(),
  billing_address_id: z.number().positive(),
  payment_method: z.nativeEnum(PaymentMethod),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  comment: z.string().optional()
});

export const createReturnRequestSchema = z.object({
  reason: z.nativeEnum(ReturnReason),
  description: z.string().min(10).max(1024),
  images: z.array(z.any()).optional()
});

export const orderQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  pageSize: z.string().optional().transform(val => parseInt(val || '10')),
  search: z.string().optional().transform(val => val || ''),
  status: z.string()
    .optional()
    .transform(val => {
      if (!val || val === '') return undefined;
      return val as OrderStatus;
    }),
  payment_status: z.string()
    .optional()
    .transform(val => {
      if (!val || val === '') return undefined;
      return val as PaymentStatus;
    }),
  startDate: z.string()
    .optional()
    .transform(val => val || undefined),
  endDate: z.string()
    .optional()
    .transform(val => val || undefined),
  sortBy: z.string()
    .optional()
    .default('created_at'),
  order: z.enum(['asc', 'desc'])
    .optional()
    .default('desc')
});

export const updateOrderAdminSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  comment: z.string().min(1, "Comment is required"),
  tracking_number: z.string().optional(),
  expected_delivery: z.string().optional().transform(val => val ? new Date(val) : undefined)
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CreateReturnRequestInput = z.infer<typeof createReturnRequestSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type UpdateOrderAdminInput = z.infer<typeof updateOrderAdminSchema>;