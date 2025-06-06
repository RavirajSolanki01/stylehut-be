import { PrismaClient } from "@prisma/client";
import { subDays } from "date-fns";

const prisma = new PrismaClient();

export const couponService = {
  async createCoupon(data: {
    coupon_code: string;
    discount: number;
    discount_text: string;
    min_order_amount: number;
    max_savings_amount: number;
    expiry_date: Date;
    is_active: boolean;
  }) {
    const coupon = await prisma.coupon.create({
      data: {
        code: data.coupon_code.toUpperCase(),
        discount: data.discount,
        min_order_amount: data.min_order_amount,
        discount_text: data.discount_text,
        max_savings_amount: data.max_savings_amount,
        expiry_date: data.expiry_date,
        is_active: data.is_active,
      },
    });

    return coupon;
  },
  async getCouponByCode(code: string, id?: number) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        ...(id && { id: { not: id } }),
      },
    });

    return coupon;
  },

  async getCoupon(id: string) {
    const coupon = await prisma.coupon.findUnique({
      where: {
        id: Number(id),
      },
    });

    return coupon;
  },

  async updateCoupon(
    id: number,
    data: {
      coupon_code: string;
      discount: number;
      is_active: boolean;
      expiry_date: Date;
      min_order_amount: number;
      max_savings_amount: number;
      discount_text: string;
    }
  ) {
    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: data.coupon_code.toUpperCase(),
        discount: data.discount,
        is_active: data.is_active,
        discount_text: data.discount_text,
        expiry_date: data.expiry_date,
        max_savings_amount: data.max_savings_amount,
        min_order_amount: data.min_order_amount,
      },
    });
    return coupon;
  },

  async deleteCoupon(id: number) {
    const coupon = await prisma.coupon.delete({
      where: { id },
    });
    return coupon;
  },

  async getAllCoupons(params: { page?: number; pageSize?: number }) {
    const { page = 1, pageSize = 10 } = params;

    const [data, total] = await Promise.all([
      prisma.coupon.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.coupon.count(),
    ]);

    return { data, total };
  },

  async getCouponForUser(params: { cart_amount?: number }) {
    const coupons = await prisma.coupon.findMany({
      where: {
        is_active: true,
        expiry_date: {
          gte: subDays(new Date(), 15), // not expired
        },
        min_order_amount: {
          lte: params.cart_amount, // minimum order amount must be ≤ cart value
        },
      },
      take: 2, // return max 2 coupons
      orderBy: {
        discount: "desc", // optional: show highest discount first
      },
    });
    return coupons;
  },
};
