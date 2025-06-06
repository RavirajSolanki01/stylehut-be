import { PrismaClient } from "@prisma/client";
import {
  CreateProductAdditionalDetailDto,
  CreateProductDto,
  UpdateProductAdditionalDetailDto,
  UpdateProductDto,
} from "../types/product.types";
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
          category: true, // this will populate the category_id data
          sub_category: true, // this will populate the sub_category_id data
          sub_category_type: true, // this will populate the sub_category_type_id data
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
              size_data: true,
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

  // async createProductAdditionalDetail(productId: number, data: CreateProductAdditionalDetailDto) {
  //   try {
  //     const result = await prisma.$transaction(async prisma => {
  //       // Create or update attributes if provided
  //       const createdAttributes = data.product_article_attributes
  //         ? await Promise.all(
  //             data.product_article_attributes.map(async (attr: { key: string; value: string }) => {
  //               // Check if attribute with same key already exists for this product
  //               const existingAttr = await prisma.product_article_attribute.findFirst({
  //                 where: {
  //                   productId,
  //                   key: attr.key,
  //                 },
  //               });

  //               if (existingAttr) {
  //                 // Update existing attribute
  //                 return prisma.product_article_attribute.update({
  //                   where: {
  //                     id: existingAttr.id,
  //                   },
  //                   data: {
  //                     value: attr.value,
  //                   },
  //                 });
  //               } else {
  //                 // Create new attribute
  //                 return prisma.product_article_attribute.create({
  //                   data: {
  //                     productId,
  //                     key: attr.key,
  //                     value: attr.value,
  //                   },
  //                 });
  //               }
  //             })
  //           )
  //         : [];

  //       // Create details if provided
  //       const createdDetails = data.product_details
  //         ? await Promise.all(
  //             data.product_details.map(
  //               async (detail: {
  //                 title: string;
  //                 description: string;
  //                 type?: string;
  //                 content?: string;
  //               }) => {
  //                 // Check if attribute with same key already exists for this product
  //                 const existingAttr = await prisma.product_detail.findFirst({
  //                   where: {
  //                     productId,
  //                     title: detail.title,
  //                   },
  //                 });

  //                 if (existingAttr) {
  //                   // Update existing attribute
  //                   return prisma.product_detail.update({
  //                     where: {
  //                       id: existingAttr.id,
  //                     },
  //                     data: {
  //                       description: detail.description,
  //                       type: detail?.type ?? existingAttr.type,
  //                       content: detail?.content ?? existingAttr.content,
  //                     },
  //                   });
  //                 } else {
  //                   return prisma.product_detail.create({
  //                     data: {
  //                       productId,
  //                       title: detail.title,
  //                       description: detail.description,
  //                       type: detail?.type ?? "",
  //                       content: detail?.content ?? "",
  //                     },
  //                   });
  //                 }
  //               }
  //             )
  //           )
  //         : [];

  //       return {
  //         attributes: createdAttributes,
  //         details: createdDetails,
  //       };
  //     });
  //     return result;
  //   } catch (error) {
  //     console.error("Create product additional detail error:", error);
  //     throw error;
  //   }
  // },

  // async updateProductAdditionalDetail(productId: number, data: UpdateProductAdditionalDetailDto) {
  //   return await prisma.$transaction(async prisma => {
  //     try {
  //       const [existingDetails, existingAttributes] = await Promise.all([
  //         prisma.product_detail.findMany({
  //           where: { productId },
  //           select: { id: true, title: true },
  //         }),
  //         prisma.product_article_attribute.findMany({
  //           where: { productId },
  //           select: { id: true, key: true },
  //         }),
  //       ]);

  //       const existingDetailsMap = new Map(existingDetails.map(d => [d.id, d]));
  //       const existingTitleMap = new Map(existingDetails.map(d => [d.title, d]));

  //       const incomingDetails = data.product_details || [];
  //       const updatedDetails = [];
  //       const preservedDetailIds = new Set<number>();

  //       for (const detail of incomingDetails) {
  //         try {
  //           const detailToUpdate = detail.id
  //             ? existingDetailsMap.get(detail.id)
  //             : existingTitleMap.get(detail.title); // fallback to title match

  //           if (detailToUpdate) {
  //             preservedDetailIds.add(detailToUpdate.id);
  //             const updated = await prisma.product_detail.update({
  //               where: { id: detailToUpdate.id },
  //               data: {
  //                 title: detail.title,
  //                 description: detail.description,
  //                 type: detail.type ?? "",
  //                 content: detail.content ?? "",
  //               },
  //             });
  //             updatedDetails.push(updated);
  //           } else {
  //             const created = await prisma.product_detail.create({
  //               data: {
  //                 productId,
  //                 title: detail.title,
  //                 description: detail.description,
  //                 type: detail.type ?? "",
  //                 content: detail.content ?? "",
  //               },
  //             });
  //             updatedDetails.push(created);
  //           }
  //         } catch (error) {
  //           console.error(`Error processing detail with title ${detail.title}:`, error);
  //         }
  //       }

  //       // Now delete only those not preserved
  //       const detailsToDelete = existingDetails.filter(d => !preservedDetailIds.has(d.id));
  //       if (detailsToDelete.length > 0) {
  //         await prisma.product_detail.deleteMany({
  //           where: { id: { in: detailsToDelete.map(d => d.id) } },
  //         });
  //       }

  //       // ============ ATTRIBUTE HANDLING ============ //
  //       const existingAttributesMap = new Map(existingAttributes.map(a => [a.id, a]));
  //       const existingKeyMap = new Map(existingAttributes.map(a => [a.key, a]));

  //       const incomingAttributes = data.product_article_attributes || [];
  //       const updatedAttributes = [];
  //       const preservedAttributeIds = new Set<number>();

  //       for (const attr of incomingAttributes) {
  //         try {
  //           const attrToUpdate = attr.id
  //             ? existingAttributesMap.get(attr.id)
  //             : existingKeyMap.get(attr.key); // fallback to key match

  //           if (attrToUpdate) {
  //             preservedAttributeIds.add(attrToUpdate.id);
  //             const updated = await prisma.product_article_attribute.update({
  //               where: { id: attrToUpdate.id },
  //               data: {
  //                 key: attr.key,
  //                 value: attr.value,
  //               },
  //             });
  //             updatedAttributes.push(updated);
  //           } else {
  //             const created = await prisma.product_article_attribute.create({
  //               data: {
  //                 productId,
  //                 key: attr.key,
  //                 value: attr.value,
  //               },
  //             });
  //             updatedAttributes.push(created);
  //           }
  //         } catch (error) {
  //           console.error(`Error processing attribute with key ${attr.key}:`, error);
  //         }
  //       }

  //       const attributesToDelete = existingAttributes.filter(a => !preservedAttributeIds.has(a.id));
  //       if (attributesToDelete.length > 0) {
  //         await prisma.product_article_attribute.deleteMany({
  //           where: { id: { in: attributesToDelete.map(a => a.id) } },
  //         });
  //       }

  //       return {
  //         attributes: updatedAttributes,
  //         details: updatedDetails,
  //       };
  //     } catch (error) {
  //       console.error("Update product additional detail error:", error);
  //       throw error;
  //     }
  //   });
  // },

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
