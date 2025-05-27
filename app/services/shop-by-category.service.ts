import { PrismaClient } from "@prisma/client";
import { ShopByCategoryOrderBy } from "../types/shop-by-category.types";
import { uploadToCloudinary } from "@/app/utils/cloudinary";
import { File } from "formidable";
import type { ShopByCategoryQueryInput } from "../utils/validationSchema/shop-by-category.validation";
import { CreateShopByCategoryDto, UpdateShopByCategoryDto } from "../types/shop-by-category.types";

const prisma = new PrismaClient();

export const shopByCategoryService = {
  async createShopByCategory(data: CreateShopByCategoryDto, file: File[]) {
    try {
      // Upload images to Cloudinary
      const imageUrls = await uploadToCloudinary(file[0].filepath);

      return await prisma.shop_by_category.create({
        data: {
          ...data,
          maxDiscount: data.maxDiscount || 100,
          minDiscount: data.minDiscount || 0,
          image: imageUrls,
        },
        include: {
          sub_category: true, // this will populate the sub_category_id data
        },
      });
    } catch (error) {
      console.error("Create product error:", error);
      throw error;
    }
  },

  async getAllShopByCategory(params: ShopByCategoryQueryInput) {
    const { page = 1, pageSize = 10, search = "", sortBy = "created_at", order = "desc" } = params;

    let orderBy: ShopByCategoryOrderBy;
    switch (sortBy) {
      case "sub_category_id":
        orderBy = { sub_category_id: order };
        break;
      default:
        orderBy = { [sortBy]: order };
    }

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          {
            sub_category: {
              name: { contains: search, mode: "insensitive" as const },
            },
          },
          ...(isNaN(parseInt(search))
            ? []
            : [
                { minDiscount: { equals: parseInt(search) } },
                { maxDiscount: { equals: parseInt(search) } },
              ]),
        ],
      }),
    };

    let include = {
      sub_category: true,
    };

    const [data, total] = await Promise.all([
      prisma.shop_by_category.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include,
      }),
      prisma.shop_by_category.count({ where }),
    ]);

    return { data, total };
  },

  async getShopByCategoryByCriteria(criteria: {
    name: string;
    sub_category_id: number;
    minDiscount: number;
    maxDiscount: number;
  }) {
    const shopByCategory = await prisma.shop_by_category.findFirst({
      where: {
        name: criteria.name,
        sub_category_id: criteria.sub_category_id,
        minDiscount: criteria.minDiscount,
        maxDiscount: criteria.maxDiscount,
      },
      include: {
        sub_category: true,
      },
    });

    return shopByCategory;
  },

  async checkDuplicateShop(
    id: number,
    criteria: {
      name: string;
      sub_category_id: number;
      minDiscount: number;
      maxDiscount: number;
    }
  ) {
    const shopByCategory = await prisma.shop_by_category.findFirst({
      where: {
        name: criteria.name,
        sub_category_id: criteria.sub_category_id,
        minDiscount: criteria.minDiscount,
        maxDiscount: criteria.maxDiscount,
        NOT: {
          id,
        },
      },
      include: {
        sub_category: true,
      },
    });

    return shopByCategory;
  },

  async getShopByCategory(id: number) {
    const shopByCategory = await prisma.shop_by_category.findFirst({
      where: {
        id,
      },
      include: {
        sub_category: true,
      },
    });

    if (!shopByCategory) return null;

    return {
      ...shopByCategory,
    };
  },

  async updateShopByCategory(id: number, data: UpdateShopByCategoryDto, files?: File[]) {
    try {
      // Get existing shop by category
      const existingProduct = await prisma.shop_by_category.findUnique({
        where: { id },
        select: {
          name: true,
          sub_category_id: true,
          minDiscount: true,
          maxDiscount: true,
          image: true,
        },
      });

      if (!existingProduct) {
        throw new Error("Shop by category not found");
      }

      // Check for duplicate entry
      if (data.name || data.sub_category_id || data.minDiscount || data.maxDiscount) {
        const duplicate = await shopByCategoryService.checkDuplicateShop(id, {
          name: data.name || existingProduct.name,
          sub_category_id: data.sub_category_id || existingProduct.sub_category_id,
          minDiscount: data.minDiscount || existingProduct.minDiscount,
          maxDiscount: data.maxDiscount || existingProduct.maxDiscount,
        });

        if (duplicate) {
          throw new Error(
            "A shop with the same name, subcategory, and discount range already exists"
          );
        }
      }

      let newImageUrl = "";
      if (files && files.length > 0) {
        newImageUrl = await uploadToCloudinary(files[0].filepath);
      }
      return await prisma.shop_by_category.update({
        where: { id },
        data: {
          ...data,
          ...(newImageUrl && { image: newImageUrl }),
          updated_at: new Date(),
        },
        include: {
          sub_category: true,
        },
      });
    } catch (error) {
      console.error("Update shop by category error:", error);
      throw error;
    }
  },

  async deleteShopByCategory(id: number) {
    return await prisma.shop_by_category.delete({
      where: { id },
    });
  },
};
