import { PrismaClient } from "@prisma/client";
import { CreateBrandDto, UpdateBrandDto } from "@/app/types/brand.types";

const prisma = new PrismaClient();

export const brandService = {
  // Create brand
  async createBrand(data: CreateBrandDto) {
    const { id, subCategories = [], ...cleanedData } = data;

    const existingBrand = await prisma.brand.findFirst({
      where: {
        name: cleanedData.name,
        is_deleted: true,
      },
    });

    if (existingBrand) {
      return await prisma.brand.update({
        where: { id: existingBrand.id },
        data: {
          is_deleted: false,
          updated_at: new Date(),
        },
      });
    }

    return prisma.$transaction(async prisma => {
      // Verify all sub-category IDs exist
      if (subCategories.length > 0) {
        const existingSubCategories = await prisma.sub_category.findMany({
          where: {
            id: { in: subCategories },
            is_deleted: false,
          },
          select: { id: true },
        });

        // Check if all provided sub-category IDs exist and are not deleted
        const existingSubCategoryIds = existingSubCategories.map(sc => sc.id);
        const invalidSubCategoryIds = subCategories.filter(
          id => !existingSubCategoryIds.includes(id)
        );

        if (invalidSubCategoryIds.length > 0) {
          throw new Error(
            `The following sub-category IDs do not exist or are deleted: ${invalidSubCategoryIds.join(", ")}`
          );
        }
      }

      // Create the brand
      const brand = await prisma.brand.create({
        data: {
          name: cleanedData.name,
          description: cleanedData.description,
          is_deleted: false,
        },
      });

      // Create brand-subcategory associations
      if (subCategories.length > 0) {
        await prisma.brand_sub_category.createMany({
          data: subCategories.map(subCatId => ({
            brand_id: brand.id,
            sub_category_id: subCatId,
          })),
          skipDuplicates: true,
        });
      }

      // Return the brand with its subcategories
      return await prisma.brand.findUnique({
        where: { id: brand.id },
        include: {
          subCategories: {
            include: {
              sub_category: true,
            },
          },
        },
      });
    });
  },

  // Get all brands
  async getAllBrands(
    skip = 0,
    take = 10,
    search = "",
    sortBy = "create_at",
    order: "asc" | "desc" = "desc"
  ) {
    const where = {
      is_deleted: false,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: order },
        include: {
          subCategories: {
            include: {
              sub_category: true,
            },
          },
        },
      }),
      prisma.brand.count({ where }),
    ]);

    return {
      data: brands,
      total,
      page: Math.floor(skip / take) + 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  },

  // Get brand by id
  async getBrandById(id: number) {
    return await prisma.brand.findFirst({
      where: {
        id,
        is_deleted: false,
      },
      include: {
        subCategories: {
          include: {
            sub_category: true,
          },
        },
      },
    });
  },

  // Update brand
  async updateBrand(id: number, data: UpdateBrandDto) {
    const { subCategories, ...brandData } = data;

    return await prisma.$transaction(async prisma => {
      // Update the brand details
      await prisma.brand.update({
        where: { id },
        data: {
          ...brandData,
          updated_at: new Date(),
        },
      });

      // If subCategories are provided, update the associations
      if (subCategories) {
        // Remove existing associations
        await prisma.brand_sub_category.deleteMany({
          where: { brand_id: id },
        });

        // Create new associations if there are any sub-categories
        if (subCategories.length > 0) {
          await prisma.brand_sub_category.createMany({
            data: subCategories.map(subCatId => ({
              brand_id: id,
              sub_category_id: subCatId,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Return the updated brand with its subcategories
      return await prisma.brand.findUnique({
        where: { id },
        include: {
          subCategories: {
            include: {
              sub_category: true,
            },
          },
        },
      });
    });
  },

  // Delete brand (soft delete)
  async deleteBrand(id: number) {
    return await prisma.brand.update({
      where: { id },
      data: {
        is_deleted: true,
        updated_at: new Date(),
      },
    });
  },

  async exists(id?: string | number): Promise<boolean> {
    if (!id) return false;
    const count = await prisma.brand.count({
      where: {
        id: Number(id),
        is_deleted: false,
      },
    });
    return count > 0;
  },
};
