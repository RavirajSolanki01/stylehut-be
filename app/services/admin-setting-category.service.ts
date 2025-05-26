import { PrismaClient } from "@prisma/client";
import { UpdateSubCategoryDto } from "../types/admin-setting-category";

const prisma = new PrismaClient();

export const adminSettingCategoryService = {
  // Update admin setting category
  async updateAdminSettingSubcategory(data: UpdateSubCategoryDto) {
    const updated = await prisma.admin_settings_category.upsert({
      where: { id: 1 },
      update: {
        cardColor: data.cardColor,
        fontColor: data.fontColor,
      },
      create: {
        id: 1,
        cardColor: data.cardColor,
        fontColor: data.fontColor,
      },
    });

    return updated;
  },

  // Get admin setting category
  async getAdminSettingSubcategory() {
    return await prisma.admin_settings_category.findFirst({
      where: { id: 1 },
    });
  },
};
