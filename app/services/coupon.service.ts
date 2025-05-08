import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const couponService = {
  async createCoupon(data: { coupon_code: string; discount: number; is_active: boolean }) {
    const coupon = await prisma.coupon.create({
      data: {
        code: data.coupon_code.toUpperCase(),
        discount: data.discount,
        is_active: data.is_active,
      },
    });

    return coupon;
  },
  async getCouponByCode(code: string, id?: number) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        ...(id && { id: { not: id } })
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

  async updateCoupon(id: number, data: { coupon_code: string; discount: number, is_active: boolean }) {
    const coupon = await prisma.coupon.update({
      where: { id },
      data: { code: data.coupon_code.toUpperCase(), discount: data.discount, is_active: data.is_active },
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
          created_at: 'desc'
        }
      }),
      prisma.coupon.count()
    ]);

    return { data, total };
  },
};
