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
});
