import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const subCategoryService = {
  async exists(id?: string | number): Promise<boolean> {
    if (!id) return false;
    const count = await prisma.sub_category.count({
      where: {
        id: Number(id),
        is_deleted: false,
      },
    });
    return count > 0;
  },

  async getSubCategoryById(id: number) {
    return await prisma.sub_category.findFirst({
      where: {
        id,
        is_deleted: false,
      },
      include: {
        category: true,
      },
    });
  },

  async getSubCategoryByCategoryIds(subCategoryId: number[]) {
    return await prisma.sub_category.findMany({
      where: {
        id: { in: subCategoryId },
        is_deleted: false,
      },
      include: {
        category: true,
      },
    });
  },
};
