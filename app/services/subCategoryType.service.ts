import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const subCategoryTypeService = {
  async exists(id?: string | number): Promise<boolean> {
    if (!id) return false;
    const count = await prisma.sub_category_type.count({
      where: {
        id: Number(id),
        is_deleted: false
      }
    });
    return count > 0;
  },

  async getSubCategoryTypeById(id: number) {
    return await prisma.sub_category_type.findFirst({
      where: {
        id,
        is_deleted: false,
      },
      include: {
        sub_category: {
          include: {
            category: true
          }
        }
      }
    });
  }
};