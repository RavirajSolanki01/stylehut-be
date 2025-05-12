import { z } from "zod";

export const createCouponSchema = z.object({
  coupon_code: z.string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(10, "Coupon code must not exceed 10 characters"),
  discount: z.coerce
    .number()
    .min(1, "Discount must be at least 1")
    .max(99, "Discount cannot exceed 99"),
  is_active: z.coerce.boolean(),
  discount_text: z.string().min(1, "Discount text must be at least 1 character"),
  min_order_amount: z.coerce.number().min(0, "Minimum order amount must be at least 0"),
  max_savings_amount: z.coerce.number().min(0, "Maximum savings amount must be at least 0"),
  expiry_date: z.coerce.date().min(new Date(), "Expiry date must be in the future"),
});
  
export const updateCouponSchema = z.object({
  coupon_code: z.string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(10, "Coupon code must not exceed 10 characters"),
  discount: z.coerce
    .number()
    .min(1, "Discount must be at least 1")
    .max(99, "Discount cannot exceed 99"),
  is_active: z.coerce.boolean(),
  min_order_amount: z.coerce.number().min(0, "Minimum order amount must be at least 0"),
  max_savings_amount: z.coerce.number().min(0, "Maximum savings amount must be at least 0"),
  expiry_date: z.coerce.date().min(new Date(), "Expiry date must be in the future"),
});
