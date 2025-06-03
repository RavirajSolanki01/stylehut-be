import { z } from 'zod';
import { OrderStatus, ReturnRequestStatus } from '@/app/types/order.types'
import { PaymentMethod, PaymentStatus, ReturnReason } from '@prisma/client';

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
      return val;
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

export const approveReturnSchema = z.object({
  pickup_date: z.coerce.date({
    required_error: "Pickup date is required",
    invalid_type_error: "Pickup date must be a valid date",
  }).min(new Date(), "Pickup date must be in the future"),
  pickup_slot: z.enum(["MORNING_9_12", "AFTERNOON_12_3", "EVENING_3_6"]).optional(),
  comment: z.string().max(255).optional()
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CreateReturnRequestInput = z.infer<typeof createReturnRequestSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type UpdateOrderAdminInput = z.infer<typeof updateOrderAdminSchema>;
export type ApproveReturnInput = z.infer<typeof approveReturnSchema>;

export const processReturnQCSchema = z.object({
  status: z.boolean({
    required_error: "QC status is required",
  }),
  notes: z.string().max(1024).optional(),
  received_condition: z.string().max(255).optional()
});

export type ProcessReturnQCInput = z.infer<typeof processReturnQCSchema>;

export const processReturnSchema = z.object({
  condition: z.string().max(255, {
    message: "Condition description cannot exceed 255 characters"
  }),
  notes: z.string().max(1024, {
    message: "Notes cannot exceed 1024 characters"
  }).optional(),
  refund_id: z.string({
    required_error: "Refund ID is required"
  }),
  status: z.string({message: "Status is required"})
    .refine(val => Object.values(ReturnRequestStatus).includes(val as ReturnRequestStatus), {
      message: "Invalid return request status"
    }),
  refund_amount: z.number().positive({
    message: "Refund amount must be positive"
  }).optional()
});

export type ProcessReturnInput = z.infer<typeof processReturnSchema>;