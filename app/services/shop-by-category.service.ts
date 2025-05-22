import { PrismaClient } from "@prisma/client";
import { UpdateProductDto } from "../types/product.types";
import {
  ProductOrderBy,
  ProductInclude,
  ProductWithRelations,
  FormattedProduct,
  RatingStats,
} from "../types/rating.types";
import { uploadToCloudinary, deleteFromCloudinary } from "@/app/utils/cloudinary";
import { File } from "formidable";
import type { ProductQueryInput } from "../utils/validationSchema/product.validation";
import { CreateShopByCategoryDto, UpdateShopByCategoryDto } from "../types/shop-by-category.types";

const prisma = new PrismaClient();

export const shopByCategoryService = {
  async createShopByCategory(data: CreateShopByCategoryDto, file: File[]) {
    try {
      // Upload images to Cloudinary
      const imageUrls = await uploadToCloudinary(file[0].filepath);

      return await prisma.shop_by_category.create({
        data: {
          maxDiscount: data.maxDiscount || 0,
          ...data,
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

  async getAllProducts(params: ProductQueryInput, userId?: any) {
    const {
      page = 1,
      pageSize = 10,
      search = "",
      sortBy = "created_at",
      order = "desc",

      category_id,
      sub_category_id,
      sub_category_type_id,
      brand_id,
      minPrice,
      maxPrice,
    } = params;

    let orderBy: ProductOrderBy;
    switch (sortBy) {
      case "category":
        orderBy = { category: { name: order } };
        break;
      case "brand":
        orderBy = { brand: { name: order } };
        break;
      case "sub_category":
        orderBy = { sub_category: { name: order } };
        break;
      case "sub_category_type":
        orderBy = { sub_category_type: { name: order } };
        break;
      default:
        orderBy = { [sortBy]: order };
    }

    const where = {
      is_deleted: false,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          {
            category: {
              name: { contains: search, mode: "insensitive" as const },
            },
          },
          {
            sub_category: {
              name: { contains: search, mode: "insensitive" as const },
            },
          },
          {
            sub_category_type: {
              name: { contains: search, mode: "insensitive" as const },
            },
          },
          {
            brand: {
              name: { contains: search, mode: "insensitive" as const },
            },
          },
          {
            OR: [
              {
                price: {
                  equals: isNaN(parseFloat(search)) ? undefined : parseFloat(search),
                },
              },
              {
                discount: {
                  equals: isNaN(parseInt(search)) ? undefined : parseInt(search),
                },
              },
              {
                quantity: {
                  equals: isNaN(parseInt(search)) ? undefined : parseInt(search),
                },
              },
            ],
          },
        ],
      }),
      ...(category_id > 0 && { category_id }),
      ...(sub_category_id > 0 && { sub_category_id }),
      ...(sub_category_type_id > 0 && { sub_category_type_id }),
      ...(brand_id > 0 && { brand_id }),
      ...((minPrice > 0 || maxPrice > 0) && {
        price: {
          ...(minPrice > 0 && { gte: minPrice }),
          ...(maxPrice > 0 && { lte: maxPrice }),
        },
      }),
    };

    // Handle popularity sorting
    if (sortBy === "popularity") {
      const products = await prisma.products.findMany({
        where,
        include: {
          ratings: {
            where: { is_deleted: false },
            select: { ratings: true },
          },
          category: true,
          sub_category: true,
          sub_category_type: true,
          brand: true,
        },
      });

      // Calculate average rating for each product
      const productsWithAvgRating = products.map(product => ({
        ...product,
        averageRating:
          product.ratings.length > 0
            ? product.ratings.reduce((acc, curr) => acc + Number(curr.ratings), 0) /
              product.ratings.length
            : 0,
      }));

      // Sort by average rating
      const sortedProducts = productsWithAvgRating.sort((a, b) =>
        order === "desc" ? b.averageRating - a.averageRating : a.averageRating - b.averageRating
      );

      // Handle pagination manually
      const start = (page - 1) * pageSize;
      const paginatedProducts = sortedProducts.slice(start, start + pageSize);

      return {
        data: paginatedProducts,
        total: products.length,
      };
    }

    let include: ProductInclude = {
      category: true,
      sub_category: true,
      sub_category_type: true,
      brand: true,
      ratings: {
        where: { is_deleted: false },
      },
      size_quantities: {
        include: {
          size_data: true,
        },
      },
    };

    if (userId) {
      include = {
        ...include,
        wishlist: {
          where: {
            user_id: Number(userId),
            is_deleted: false,
          },
        },
        cart_items: {
          where: {
            is_deleted: false,
            cart: {
              user_id: Number(userId),
              is_deleted: false,
            },
          },
        },
      };
    }

    const [data, total] = await Promise.all([
      prisma.products.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include,
      }),
      prisma.products.count({ where }),
    ]);

    const formattedData = data.map((product: ProductWithRelations): FormattedProduct => {
      const ratings = product.ratings || [];

      // Calculate average rating
      const averageRating =
        ratings.length > 0
          ? ratings.reduce((acc, curr) => acc + Number(curr.ratings), 0) / ratings.length
          : 0;

      // Get rating distribution
      const ratingDistribution: RatingStats["distribution"] = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      product.ratings.forEach(rating => {
        ratingDistribution[Number(rating.ratings) as keyof typeof ratingDistribution]++;
      });

      let formattedProduct: FormattedProduct = {
        ...product,
        ratingStats: {
          averageRating,
          totalRatings: product.ratings.length,
          distribution: ratingDistribution,
        },
      };

      if (userId) {
        formattedProduct.isInCart = (product?.cart_items?.length || 0) > 0;
        formattedProduct.isInWishlist = (product?.wishlist?.length || 0) > 0;
      }

      return formattedProduct;
    });

    return { data: formattedData, total };
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
        select: { image: true },
      });

      if (!existingProduct) {
        throw new Error("Shop by category not found");
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
