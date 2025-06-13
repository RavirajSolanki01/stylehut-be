import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const categoryService = {
  async exists(id?: string | number): Promise<boolean> {
    if (!id) return false;
    const count = await prisma.category.count({
      where: {
        id: Number(id),
        is_deleted: false
      }
    });
    return count > 0;
  },

  async getCategoryById(id: number) {
    return await prisma.category.findFirst({
      where: {
        id,
        is_deleted: false,
      },
    });
  },

  async getAllCategoryData() {
    try {
      const [categories, brands] = await Promise.all([
        // Fetch categories with related data
        prisma.category.findMany({
          where: { is_deleted: false },
          include: {
            sub_categories: {
              where: { is_deleted: false },
              include: {
                sub_category_types: {
                  where: { is_deleted: false }
                }
              }
            }
          },
          orderBy: { name: 'asc' }
        }),
        // Fetch brands
        prisma.brand.findMany({
          where: { is_deleted: false },
          orderBy: { name: 'asc' }
        }),
      ]);

      // Transform the data for better organization
      const formattedData = {
        categories: categories.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description,
          sub_categories: category.sub_categories.map(subCategory => ({
            id: subCategory.id,
            name: subCategory.name,
            description: subCategory.description,
            sub_category_types: subCategory.sub_category_types.map(type => ({
              id: type.id,
              name: type.name,
              description: type.description
            }))
          }))
        })),
        brands: brands.map(brand => ({
          id: brand.id,
          name: brand.name,
          description: brand.description
        }))
      };

      return formattedData;
    } catch (error) {
      console.error('Get category data error:', error);
      throw error;
    }
  }
};