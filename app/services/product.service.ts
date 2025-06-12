import { PrismaClient } from "@prisma/client";
import { CreateProductDto, UpdateProductDto } from "../types/product.types";
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

const prisma = new PrismaClient();

export const productService = {
  // async createProduct(data: CreateProductDto, files: Blob[]) {
  async createProduct(data: CreateProductDto, files: File[]) {
    try {
      // Upload images to Cloudinary
      const imageUrls = await Promise.all(files.map(file => uploadToCloudinary(file.filepath)));

      const allSizeData = await prisma.size_quantity.findMany({
        where: {
          custom_product_id: data.custom_product_id,
          is_deleted: false,
        },
      });

      return await prisma.products.create({
        data: {
          ...data,
          image: imageUrls,
          custom_product_id: data.custom_product_id,
          is_deleted: false,
          size_quantities: {
            connect: allSizeData.map(size => ({ id: size.id })),
          },
          is_main_product: data.is_main_product,
          variant_id: data.variant_id,
        },
        include: {
          sub_category_type: {
            include: {
              sub_category: {
                include: {
                  category: true,
                },
              },
            },
          }, // this will populate the sub_category_type_id data
          brand: true, // this will populate the brand_id data
          size_quantities: {
            include: {
              size_data: true,
            },
          },
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
      minDiscount,
      maxDiscount,
    } = params;

    let orderBy;
    switch (sortBy) {
      case "category":
        orderBy = { sub_category_type: { sub_category: { category: { name: order } } } };
        break;
      case "brand":
        orderBy = { brand: { name: order } };
        break;
      case "sub_category":
        orderBy = { sub_category_type: { sub_category: { name: order } } };
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
            sub_category_type: {
              name: { contains: search, mode: "insensitive" as const },
              sub_category: {
                name: { contains: search, mode: "insensitive" as const },
                category: {
                  name: { contains: search, mode: "insensitive" as const },
                },
              },
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
            ],
          },
        ],
      }),
      ...(category_id > 0 && {
        sub_category_type: { sub_category: { category: { id: category_id } } },
      }),
      ...(sub_category_id > 0 && { sub_category_type: { sub_category: { id: sub_category_id } } }),
      ...(sub_category_type_id > 0 && { sub_category_type_id }),
      ...(brand_id > 0 && { brand_id }),
      ...((minPrice > 0 || maxPrice > 0) && {
        price: {
          ...(minPrice > 0 && { gte: minPrice }),
          ...(maxPrice > 0 && { lte: maxPrice }),
        },
      }),
      ...((minDiscount >= 0 || maxDiscount <= 100) && {
        discount: {
          ...(minDiscount >= 0 && { gte: minDiscount }),
          ...(maxDiscount <= 100 && { lte: maxDiscount }),
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
          sub_category_type: {
            include: {
              sub_category: {
                include: {
                  category: true,
                },
              },
            },
          },
          brand: true,
          size_quantities: {
            include: {
              size_data: true,
            },
          },
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
      sub_category_type: {
        include: {
          sub_category: {
            include: {
              category: true,
            },
          },
        },
      },
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
      // Safely get ratings array
      const productRatings = Array.isArray(product.ratings) ? product.ratings : [];

      // Calculate average rating
      const averageRating =
        productRatings.length > 0
          ? productRatings.reduce((acc: number, curr) => {
              const ratingValue = curr?.ratings ? Number(curr.ratings) : 0;
              return acc + (isNaN(ratingValue) ? 0 : ratingValue);
            }, 0) / productRatings.length
          : 0;

      // Get rating distribution
      const ratingDistribution: RatingStats["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      productRatings.forEach(rating => {
        if (rating?.ratings) {
          const ratingValue = Math.min(5, Math.max(1, Math.round(Number(rating.ratings))));
          if (ratingValue >= 1 && ratingValue <= 5) {
            ratingDistribution[ratingValue as keyof typeof ratingDistribution]++;
          }
        }
      });

      // Create formatted product with proper typing
      const formattedProduct: FormattedProduct = {
        ...product,
        ratingStats: {
          averageRating: isNaN(averageRating) ? 0 : parseFloat(averageRating.toFixed(2)),
          totalRatings: productRatings.length,
          distribution: ratingDistribution,
        },
        isInCart: userId ? (product.cart_items?.length || 0) > 0 : undefined,
        isInWishlist: userId ? (product.wishlist?.length || 0) > 0 : undefined,
      };

      return formattedProduct;
    });

    return { data: formattedData, total };
  },

  async getProductById(id: number) {
    const product = await prisma.products.findFirst({
      where: {
        id,
        is_deleted: false,
      },
      include: {
        sub_category_type: {
          include: {
            sub_category: {
              include: {
                category: true,
              },
            },
          },
        },
        brand: true,
        ratings: {
          where: { is_deleted: false },
          include: {
            users: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                profile_url: true,
              },
            },
          },
          orderBy: {
            create_at: "desc",
          },
        },
        size_quantities: {
          include: {
            size_data: {
              include: {
                size_chart_data: true,
              },
            },
          },
        },
      },
    });

    if (!product) return null;

    const size_quantities = await prisma.size_quantity.findMany({
      where: {
        custom_product_id: product.custom_product_id,
        is_deleted: false,
      },
      include: {
        size_data: {
          include: {
            size_chart_data: true,
          },
        },
      },
    });

    // Calculate average rating
    const averageRating =
      product.ratings.length > 0
        ? product.ratings.reduce((acc, curr) => acc + Number(curr.ratings), 0) /
          product.ratings.length
        : 0;

    // Get rating distribution
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    product.ratings.forEach(rating => {
      ratingDistribution[Number(rating.ratings) as keyof typeof ratingDistribution]++;
    });

    let relatedProducts: any[] = [];
    if (product.variant_id) {
      relatedProducts = await prisma.products.findMany({
        where: {
          variant_id: product.variant_id,
          is_deleted: false,
          NOT: {
            id: product.id, // exclude the current product
          },
        },
        include: {
          size_quantities: {
            include: {
              size_data: {
                include: {
                  size_chart_data: true,
                },
              },
            },
          },
          brand: true,
          sub_category_type: {
            include: {
              sub_category: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });
    }

    return {
      ...product,
      size_quantities,
      ratingStats: {
        averageRating,
        totalRatings: product.ratings.length,
        distribution: ratingDistribution,
      },

      relatedProducts,
    };
  },

  async updateProduct(id: number, data: UpdateProductDto, files?: File[]) {
    try {
      // Get existing product
      const existingProduct = await prisma.products.findUnique({
        where: { id },
        select: { image: true },
      });

      if (!existingProduct) {
        throw new Error("Product not found");
      }

      let imageUrls = [...existingProduct.image];

      if (files && files.length > 0) {
        const newImageUrls = await Promise.all(
          files.map(file => uploadToCloudinary(file.filepath))
        );

        imageUrls = [...imageUrls, ...newImageUrls];
      }
      const allSizeData = await prisma.size_quantity.findMany({
        where: {
          custom_product_id: data.custom_product_id,
          is_deleted: false,
        },
      });

      return await prisma.products.update({
        where: { id },
        data: {
          ...data,
          ...(imageUrls && { image: imageUrls }),
          updated_at: new Date(),
          size_quantities: {
            connect: allSizeData.map(size => ({
              id: size.id,
            })),
          },
        },
        include: {
          sub_category_type: {
            include: {
              sub_category: {
                include: {
                  category: true,
                },
              },
            },
          },
          brand: true,
          size_quantities: {
            include: {
              size_data: {
                include: {
                  size_chart_data: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("Update product error:", error);
      throw error;
    }
  },

  async deleteProduct(id: number) {
    return await prisma.products.update({
      where: { id },
      data: {
        is_deleted: true,
        updated_at: new Date(),
      },
    });
  },

  async removeProductImages(id: number, imageUrls: string[]) {
    try {
      // Get existing product
      const product = await prisma.products.findUnique({
        where: { id },
        select: { image: true },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      // Validate that all imageUrls exist in product.image
      const invalidUrls = imageUrls.filter(url => !product.image.includes(url));
      if (invalidUrls.length > 0) {
        throw new Error("Some image URLs are invalid");
      }

      // Ensure at least one image remains
      const remainingImages = product.image.filter(url => !imageUrls.includes(url));
      if (remainingImages.length === 0) {
        throw new Error("Cannot remove all images. Product must have at least one image");
      }

      // Delete images from Cloudinary
      await Promise.all(
        imageUrls.map(async url => {
          const publicId = url.split("/").pop()?.split(".")[0];
          if (publicId) await deleteFromCloudinary(publicId);
        })
      );

      // Update product with remaining images
      return await prisma.products.update({
        where: { id },
        data: {
          image: remainingImages,
          updated_at: new Date(),
        },
        include: {
          sub_category_type: {
            include: {
              sub_category: {
                include: {
                  category: true,
                },
              },
            },
          },
          brand: true,
        },
      });
    } catch (error) {
      console.error("Remove product images error:", error);
      throw error;
    }
  },
};
