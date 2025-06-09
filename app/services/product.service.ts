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

      const { product_additional_details, product_specifications, ...productData } = data;

      const result = await prisma.$transaction(async prisma => {
        // Create the main product
        const product = await prisma.products.create({
          data: {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            discount: productData.discount,
            category_id: productData.category_id,
            sub_category_id: productData.sub_category_id,
            sub_category_type_id: productData.sub_category_type_id,
            brand_id: productData.brand_id,
            custom_product_id: productData.custom_product_id,
            is_main_product: productData.is_main_product ?? true,
            variant_id: productData.variant_id,
            image: imageUrls,
            is_deleted: false,
            size_quantities: {
              connect: allSizeData.map(size => ({ id: size.id })),
            },
          },
        });

        // Handle product additional details
        if (product_additional_details && product_additional_details?.length > 0) {
          await prisma.product_additional_details.createMany({
            data: product_additional_details.map(detail => ({
              product_id: product.id,
              additional_key_id: detail.id,
              value: detail.value,
            })),
            skipDuplicates: true,
          });
        }

        // Handle product specifications
        if (product_specifications && product_specifications?.length > 0) {
          await prisma.product_specifications.createMany({
            data: product_specifications.map(spec => ({
              product_id: product.id,
              specification_key_id: spec.id,
              value: spec.value,
            })),
            skipDuplicates: true,
          });
        }

        // Fetch the full product with relations
        return prisma.products.findUnique({
          where: { id: product.id },
          include: {
            category: true,
            sub_category: true,
            sub_category_type: true,
            brand: true,
            size_quantities: {
              include: {
                size_data: true,
              },
            },
            product_additional_details: {
              include: {
                product_additional_detail_key: true,
              },
            },
            product_specifications: {
              include: {
                product_specification_key: true,
              },
            },
          },
        });
      });

      return result;
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
          category: true,
          sub_category: true,
          sub_category_type: true,
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

  async getProductById(id: number) {
    const product = await prisma.products.findFirst({
      where: {
        id,
        is_deleted: false,
      },
      include: {
        category: true,
        sub_category: true,
        sub_category_type: true,
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
        product_additional_details: {
          include: {
            product_additional_detail_key: true,
          },
        },
        product_specifications: {
          include: {
            product_specification_key: true,
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
          category: true,
          sub_category: true,
          sub_category_type: true,
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
        select: {
          image: true,
          custom_product_id: true,
        },
      });

      if (!existingProduct) {
        throw new Error("Product not found");
      }

      // Extract additional details and specifications from the data
      const { product_additional_details, product_specifications, ...productData } = data;

      let imageUrls = [...existingProduct.image];

      if (files && files.length > 0) {
        const newImageUrls = await Promise.all(
          files.map(file => uploadToCloudinary(file.filepath))
        );
        imageUrls = [...imageUrls, ...newImageUrls];
      }

      const customProductId = data.custom_product_id || existingProduct.custom_product_id;
      const allSizeData = await prisma.size_quantity.findMany({
        where: {
          custom_product_id: customProductId,
          is_deleted: false,
        },
      });

      // Use transaction to ensure data consistency
      return await prisma.$transaction(async prisma => {
        // Update the product
        const updatedProduct = await prisma.products.update({
          where: { id },
          data: {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            discount: productData.discount,
            category_id: productData.category_id,
            sub_category_id: productData.sub_category_id,
            sub_category_type_id: productData.sub_category_type_id,
            brand_id: productData.brand_id,
            custom_product_id: customProductId,
            is_main_product: productData.is_main_product,
            variant_id: productData.variant_id,
            image: imageUrls,
            updated_at: new Date(),
            size_quantities: {
              set: allSizeData.map(size => ({ id: size.id })),
            },
          },
        });

        // Update additional details if provided
        if (product_additional_details) {
          // Get all additional detail key IDs from the input
          const additionalDetailKeyIds = product_additional_details.map(detail => detail.id);

          // Check if all additional detail keys exist and are not deleted
          const existingKeys = await prisma.product_additional_detail_key.findMany({
            where: {
              id: { in: additionalDetailKeyIds },
              is_deleted: false,
            },
            select: { id: true },
          });

          // Check if any specified key is missing
          const existingKeyIds = new Set(existingKeys.map(key => key.id));
          const missingKeys = additionalDetailKeyIds.filter(id => !existingKeyIds.has(id));

          if (missingKeys.length > 0) {
            throw new Error(
              `The following additional detail keys do not exist or are deleted: ${missingKeys.join(", ")}`
            );
          }

          // Get existing additional details for this product
          const existingDetails = await prisma.product_additional_details.findMany({
            where: { product_id: id },
            select: { additional_key_id: true },
          });

          const existingDetailIds = new Set(
            existingDetails.map(detail => detail.additional_key_id)
          );
          const newDetails = product_additional_details.filter(
            detail => !existingDetailIds.has(detail.id)
          );
          const updatedDetails = product_additional_details.filter(detail =>
            existingDetailIds.has(detail.id)
          );
          const detailsToDelete = existingDetails.filter(
            detail => !additionalDetailKeyIds.includes(detail.additional_key_id)
          );

          // Delete additional details that are no longer needed
          if (detailsToDelete.length > 0) {
            await prisma.product_additional_details.deleteMany({
              where: {
                product_id: id,
                additional_key_id: { in: detailsToDelete.map(d => d.additional_key_id) },
              },
            });
          }

          // Create new additional details
          if (newDetails.length > 0) {
            await prisma.product_additional_details.createMany({
              data: newDetails.map(detail => ({
                product_id: id,
                additional_key_id: detail.id,
                value: detail.value,
              })),
              skipDuplicates: true,
            });
          }

          // Update existing additional details
          await Promise.all(
            updatedDetails.map(detail =>
              prisma.product_additional_details.updateMany({
                where: {
                  product_id: id,
                  additional_key_id: detail.id,
                },
                data: { value: detail.value },
              })
            )
          );
        }

        // Update specifications if provided
        if (product_specifications) {
          // Get all specification key IDs from the input
          const specificationKeyIds = product_specifications.map(spec => spec.id);

          // Check if all specification keys exist and are not deleted
          const existingKeys = await prisma.product_specification_key.findMany({
            where: {
              id: { in: specificationKeyIds },
              is_deleted: false,
            },
            select: { id: true },
          });

          // Check if any specified key is missing
          const existingKeyIds = new Set(existingKeys.map(key => key.id));
          const missingKeys = specificationKeyIds.filter(id => !existingKeyIds.has(id));

          if (missingKeys.length > 0) {
            throw new Error(
              `The following specification keys do not exist or are deleted: ${missingKeys.join(", ")}`
            );
          }

          // Get existing specifications for this product
          const existingSpecs = await prisma.product_specifications.findMany({
            where: { product_id: id },
            select: { specification_key_id: true },
          });

          const existingSpecIds = new Set(existingSpecs.map(spec => spec.specification_key_id));
          const newSpecs = product_specifications.filter(spec => !existingSpecIds.has(spec.id));
          const updatedSpecs = product_specifications.filter(spec => existingSpecIds.has(spec.id));
          const specsToDelete = existingSpecs.filter(
            spec => !specificationKeyIds.includes(spec.specification_key_id)
          );

          // Delete specifications that are no longer needed
          if (specsToDelete.length > 0) {
            await prisma.product_specifications.deleteMany({
              where: {
                product_id: id,
                specification_key_id: { in: specsToDelete.map(s => s.specification_key_id) },
              },
            });
          }

          // Create new specifications
          if (newSpecs.length > 0) {
            await prisma.product_specifications.createMany({
              data: newSpecs.map(spec => ({
                product_id: id,
                specification_key_id: spec.id,
                value: spec.value,
              })),
              skipDuplicates: true,
            });
          }

          // Update existing specifications
          await Promise.all(
            updatedSpecs.map(spec =>
              prisma.product_specifications.updateMany({
                where: {
                  product_id: id,
                  specification_key_id: spec.id,
                },
                data: { value: spec.value },
              })
            )
          );
        }

        // Return the updated product with all relations
        return prisma.products.findUnique({
          where: { id },
          include: {
            category: true,
            sub_category: true,
            sub_category_type: true,
            brand: true,
            size_quantities: {
              include: {
                size_data: true,
              },
            },
            product_additional_details: {
              include: {
                product_additional_detail_key: true,
              },
            },
            product_specifications: {
              include: {
                product_specification_key: true,
              },
            },
          },
        });
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
          category: true,
          sub_category: true,
          sub_category_type: true,
          brand: true,
        },
      });
    } catch (error) {
      console.error("Remove product images error:", error);
      throw error;
    }
  },

  async createProductAdditionalKey(data: { name: string }) {
    return await prisma.product_additional_detail_key.create({
      data: {
        name: data.name.trim(),
      },
    });
  },

  async checkProductAdditionalKeyPresent(name: string) {
    return await prisma.product_additional_detail_key.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
        is_deleted: false,
      },
    });
  },

  async checkProductAdditionalKeyPresentWithId(name: string, id: number) {
    return await prisma.product_additional_detail_key.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
        id: {
          not: id,
        },
        is_deleted: false,
      },
    });
  },

  async checkProductAdditionalKeyAssociatedWithProduct(additionalKeyId: number) {
    return await prisma.products.findFirst({
      where: {
        product_additional_details: {
          some: {
            additional_key_id: additionalKeyId,
          },
        },
        is_deleted: false,
      },
    });
  },

  async deleteProductAdditionalKey(id: number) {
    return await prisma.product_additional_detail_key.update({
      where: { id },
      data: {
        is_deleted: true,
      },
    });
  },

  async updateProductAdditionalKey(id: number, data: { name: string }) {
    return await prisma.product_additional_detail_key.update({
      where: { id },
      data: {
        name: data.name.trim(),
      },
    });
  },

  async getSingleProductAdditionalKey(id: number) {
    return await prisma.product_additional_detail_key.findUnique({
      where: { id, is_deleted: false },
    });
  },

  async getAllProductAdditionalKey(options?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    search?: string;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = options?.sortBy || "created_at";
    const sortOrder = options?.sortOrder || "desc";
    const search = options?.search?.trim();

    // Build the where clause with search condition
    const whereClause: any = {
      is_deleted: false,
    };

    if (search) {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.product_additional_detail_key.findMany({
        where: whereClause,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.product_additional_detail_key.count({
        where: whereClause,
      }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async createProductSpecificationKey(data: { name: string }) {
    return await prisma.product_specification_key.create({
      data: {
        name: data.name.trim(),
      },
    });
  },

  async checkProductSpecificationKeyPresent(name: string) {
    return await prisma.product_specification_key.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
        is_deleted: false,
      },
    });
  },

  async checkProductSpecificationKeyPresentWithId(name: string, id: number) {
    return await prisma.product_specification_key.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
        id: {
          not: id,
        },
        is_deleted: false,
      },
    });
  },

  async checkProductSpecificationAssociatedWithProduct(specificationId: number) {
    return await prisma.products.findFirst({
      where: {
        product_specifications: {
          some: {
            specification_key_id: specificationId,
          },
        },
        is_deleted: false,
      },
    });
  },

  async deleteProductSpecificationKey(id: number) {
    return await prisma.product_specification_key.update({
      where: { id },
      data: {
        is_deleted: true,
      },
    });
  },

  async updateProductSpecificationKey(id: number, data: { name: string }) {
    return await prisma.product_specification_key.update({
      where: { id },
      data: {
        name: data.name.trim(),
      },
    });
  },

  async getSingleProductSpecificationKey(id: number) {
    return await prisma.product_specification_key.findUnique({
      where: { id, is_deleted: false },
    });
  },

  async getAllProductSpecificationKey(options?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    search?: string;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = options?.sortBy || "created_at";
    const sortOrder = options?.sortOrder || "desc";
    const search = options?.search?.trim();

    // Build the where clause with search condition
    const whereClause: any = {
      is_deleted: false,
    };

    if (search) {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.product_specification_key.findMany({
        where: whereClause,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.product_specification_key.count({
        where: whereClause,
      }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
