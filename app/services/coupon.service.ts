import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const couponService = {
  async createCoupon(data: { coupon_code: string; discount: number }) {
    const coupon = await prisma.coupon.create({
      data: {
        code: data.coupon_code.toUpperCase(),
        discount: data.discount,
      },
    });

    return coupon;
  },
  async getCouponByCode(code: string) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
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

  async updateCoupon(id: number, data: { coupon_code: string; discount: number }) {
    const coupon = await prisma.coupon.update({
      where: { id },
      data: { code: data.coupon_code.toUpperCase(), discount: data.discount },
    });
    return coupon;
  },

  async deleteCoupon(id: number) {
    const coupon = await prisma.coupon.delete({
      where: { id },
    });
    return coupon;
  },

  async getAllCoupons() {
    const coupons = await prisma.coupon.findMany();
    return coupons;
  },
};
