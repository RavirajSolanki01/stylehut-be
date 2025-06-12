import { PrismaClient } from "@prisma/client";
import { CreateBrandDto, UpdateBrandDto } from "@/app/types/brand.types";

const prisma = new PrismaClient();

export const brandService = {
  // Create brand
  async createBrand(data: CreateBrandDto) {
    const existingBrand = await prisma.brand.findFirst({
      where: {
        name: data.name,
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

    const { id, ...cleanedData } = data;

    return await prisma.brand.create({
      data: {
        name: cleanedData.name,
        description: cleanedData.description,
        sub_categories: {
          connect: cleanedData.subCategories.map(id => ({ id })),
        },
        is_deleted: false,
      },
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
    console.log("order by", sortBy, order);
    const orderBy = { [sortBy]: order };
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

    return await prisma.brand.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: order },
    });
  },

  // Get brand by id
  async getBrandById(id: number) {
    return await prisma.brand.findFirst({
      where: {
        id,
        is_deleted: false,
      },
      include: {
        sub_categories: true,
      },
    });
  },

  // Update brand
  async updateBrand(id: number, data: UpdateBrandDto) {
    console.log("data", data);
    return await prisma.brand.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        sub_categories: {
          set: data.subCategories.map(id => ({ id })),
        },
        updated_at: new Date(),
      },
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
