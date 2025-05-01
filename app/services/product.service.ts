import { PrismaClient } from "@prisma/client";
import { CreateProductDto, UpdateProductDto } from "../types/product.types";
import { uploadToCloudinary, deleteFromCloudinary } from "@/app/utils/cloudinary";
import { File } from 'formidable';
import type { ProductQueryInput } from "../utils/validationSchema/product.validation";

const prisma = new PrismaClient();

export const productService = {
  // async createProduct(data: CreateProductDto, files: Blob[]) {
  async createProduct(data: CreateProductDto, files: File[]) {
    try {
      // Upload images to Cloudinary
      const imageUrls = await Promise.all(
        files.map((file) => uploadToCloudinary(file.filepath))
      );

  

      return await prisma.products.create({
        data: {
          ...data,
          image: imageUrls,
          is_deleted: false,
        },
        include: {
          category: true,
          sub_category: true,
          sub_category_type: true,
          brand: true,
        },
      });
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  },

  async getAllProducts(params: ProductQueryInput) {
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

    let orderBy: any;
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
              name: { contains: search, mode: "insensitive" as const }
            }
          },
          {
            sub_category: {
              name: { contains: search, mode: "insensitive" as const }
            }
          },
          {
            sub_category_type: {
              name: { contains: search, mode: "insensitive" as const }
            }
          },
          {
            brand: {
              name: { contains: search, mode: "insensitive" as const }
            }
          },
          {
            OR: [
              {
                price: {
                  equals: isNaN(parseFloat(search)) ? undefined : parseFloat(search)
                }
              },
              {
                discount: {
                  equals: isNaN(parseInt(search)) ? undefined : parseInt(search)
                }
              },
              {
                quantity: {
                  equals: isNaN(parseInt(search)) ? undefined : parseInt(search)
                }
              }
            ]
          }
        ],
      }),
      ...(category_id > 0 && { category_id }),
      ...(sub_category_id > 0 && { sub_category_id }),
      ...(sub_category_type_id > 0 && { sub_category_type_id }),
      ...(brand_id > 0 && { brand_id }),
      ...(minPrice > 0 || maxPrice > 0) && {
        price: {
          ...(minPrice > 0 && { gte: minPrice }),
          ...(maxPrice > 0 && { lte: maxPrice }),
        },
      },
    };

    // Handle popularity sorting
    if (sortBy === "popularity") {
      const products = await prisma.products.findMany({
        where,
        include: {
          ratings: {
            where: { is_deleted: false },
            select: { ratings: true }
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
        averageRating: product.ratings.length > 0
          ? product.ratings.reduce((acc, curr) => acc + Number(curr.ratings), 0) / product.ratings.length
          : 0
      }));

      // Sort by average rating
      const sortedProducts = productsWithAvgRating.sort((a, b) => 
        order === 'desc' 
          ? b.averageRating - a.averageRating
          : a.averageRating - b.averageRating
      );

      // Handle pagination manually
      const start = (page - 1) * pageSize;
      const paginatedProducts = sortedProducts.slice(start, start + pageSize);

      return {
        data: paginatedProducts,
        total: products.length
      };
    }

    const [data, total] = await Promise.all([
      prisma.products.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: true,
          sub_category: true,
          sub_category_type: true,
          brand: true,
          ratings: true, // Include ratings to calculate average
        },
      }),
      prisma.products.count({ where }),
    ]);

    return { data, total };
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
              }
            }
          },
          orderBy: {
            create_at: 'desc'
          }
        },
      },
    });
  
    if (!product) return null;
  
    // Calculate average rating
    const averageRating = product.ratings.length > 0
      ? product.ratings.reduce((acc, curr) => acc + Number(curr.ratings), 0) / product.ratings.length
      : 0;
  
    // Get rating distribution
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };
  
    product.ratings.forEach(rating => {
      ratingDistribution[Number(rating.ratings) as keyof typeof ratingDistribution]++;
    });
  
    return {
      ...product,
      ratingStats: {
        averageRating,
        totalRatings: product.ratings.length,
        distribution: ratingDistribution
      }
    };
  },

  async updateProduct(id: number, data: UpdateProductDto, files?: File[]) {
    
    try {
      // Get existing product
      const existingProduct = await prisma.products.findUnique({
        where: { id },
        select: { image: true }
      });

      if (!existingProduct) {
        throw new Error('Product not found');
      }

      let imageUrls = [...existingProduct.image];

      if (files && files.length > 0) {
        const newImageUrls = await Promise.all(
          files.map((file) => uploadToCloudinary(file.filepath))
        );

        imageUrls = [...imageUrls, ...newImageUrls];
      }

      return await prisma.products.update({
        where: { id },
        data: {
          ...data,
          ...(imageUrls && { image: imageUrls }),
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
      console.error('Update product error:', error);
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
        select: { image: true }
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // Validate that all imageUrls exist in product.image
      const invalidUrls = imageUrls.filter(url => !product.image.includes(url));
      if (invalidUrls.length > 0) {
        throw new Error('Some image URLs are invalid');
      }

      // Ensure at least one image remains
      const remainingImages = product.image.filter(url => !imageUrls.includes(url));
      if (remainingImages.length === 0) {
        throw new Error('Cannot remove all images. Product must have at least one image');
      }

      // Delete images from Cloudinary
      await Promise.all(
        imageUrls.map(async (url) => {
          const publicId = url.split('/').pop()?.split('.')[0];
          if (publicId) await deleteFromCloudinary(publicId);
        })
      );

      // Update product with remaining images
      return await prisma.products.update({
        where: { id },
        data: {
          image: remainingImages,
          updated_at: new Date()
        },
        include: {
          category: true,
          sub_category: true,
          sub_category_type: true,
          brand: true,
        }
      });
    } catch (error) {
      console.error('Remove product images error:', error);
      throw error;
    }
  },
};