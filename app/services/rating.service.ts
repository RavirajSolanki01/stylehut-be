import { PrismaClient } from "@prisma/client";
import { CreateRatingInput, UpdateRatingInput, RatingQueryInput } from "@/app/utils/validationSchema/rating.validation";
import { uploadToCloudinary, deleteFromCloudinary } from "@/app/utils/cloudinary";
import { File } from 'formidable';

const prisma = new PrismaClient();

export const ratingService = {
  async createRating(userId: number, data: CreateRatingInput, files: File[]) {

    // Upload images to Cloudinary
    const imageUrls = files && files.length > 0 
      ? await Promise.all(files.map((file) => uploadToCloudinary(file.filepath)))
      : [];
    
    return await prisma.ratings.create({
      data: {
        ...data,
        user_id: userId,
        images: imageUrls,
        is_deleted: false,
      },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_url: true,
          },
        },
        products: {
          select: {
            id: true,
            name: true,
            image: true,
            size_quantities: true
          },
        },
      },
    });
  },

  async getAllRatings(params: RatingQueryInput) {
    const {
      page = 1,
      pageSize = 10,
      search,
      product_id,
      user_id,
      minRating,
      maxRating,
      sortBy = 'create_at',
      order = 'desc'
    } = params;

    let orderBy: any;
    switch (sortBy) {
      case "first_name":
        orderBy = { users: { first_name: order } };
        break;
      case "last_name":
        orderBy = { users: { last_name: order } };
        break;
      case "name":
        orderBy = { products: { name: order } };
        break;
      case "brand":
        orderBy = { products: { brand: { name: order } } };
        break;
      case "category":
        orderBy = { products: { category: { name: order } } };
        break;
      case "sub_category":
        orderBy = { products: { sub_category: { name: order } } };
        break;
      case "sub_category_type":
        orderBy = { products: { sub_category_type: { name: order } } };
        break;
      default:
        orderBy = { [sortBy]: order };
    }

    const where = {
      is_deleted: false,
      ...(search && {
        OR: [
          {
            users: {
              OR: [
                { email: { contains: search, mode: "insensitive" as const } },
                { first_name: { contains: search, mode: "insensitive" as const } },
                { last_name: { contains: search, mode: "insensitive" as const } },
              ],
            },
          },
          { description: { contains: search, mode: "insensitive" as const } },
          {
            products: {
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
                  brand: {
                    name: { contains: search, mode: "insensitive" as const }
                  }
                },
                {
                  sub_category_type: {
                    name: { contains: search, mode: "insensitive" as const }
                  }
                }
              ]
            }
          }
        ],
      }),
      ...(product_id && { product_id }),
      ...(user_id && { user_id }),
      ...(minRating || maxRating) && {
        ratings: {
          ...(minRating && { gte: minRating }),
          ...(maxRating && { lte: maxRating }),
        },
      },
    };

    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      prisma.ratings.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              profile_url: true,
            },
          },
          products: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      }),
      prisma.ratings.count({ where }),
    ]);

    return { data, total };
  },

  async getRatingById(id: number) {
    return await prisma.ratings.findFirst({
      where: {
        id,
        is_deleted: false,
      },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_url: true,
          },
        },
        products: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
  },

  async updateRating(id: number, userId: number, data: UpdateRatingInput, files?: File[]) {
    try {
      // First check if rating belongs to user
      const rating = await prisma.ratings.findFirst({
        where: { id, user_id: userId, is_deleted: false },
      });
  
      if (!rating) {
        throw new Error('Rating not found or unauthorized');
      }
  
      let imageUrls = [...rating.images];
      if (files && files.length > 0) {
        const newImageUrls = await Promise.all(
          files.map((file) => uploadToCloudinary(file.filepath))
        );
        imageUrls = [...imageUrls, ...newImageUrls];
      }
  
      return await prisma.ratings.update({
        where: { id },
        data: {
          ...data,
          ...(imageUrls && { images: imageUrls }),
          updated_at: new Date(),
        },
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              profile_url: true,
            },
          },
          products: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Update rating error:', error);
      throw error;
    }
  },

  async deleteRating(id: number, userId: number) {
    // First check if rating belongs to user
    const rating = await prisma.ratings.findFirst({
      where: { id, user_id: userId, is_deleted: false },
    });

    if (!rating) {
      throw new Error('Rating not found or unauthorized');
    }

    return await prisma.ratings.update({
      where: { id },
      data: {
        is_deleted: true,
        updated_at: new Date(),
      },
    });
  },

  async removeRatingImages(id: number, userId: number, imageUrls: string[]) {
      try {
        const ratings = await prisma.ratings.findFirst({
          where: { 
            id,
            user_id: userId,
            is_deleted: false
          },
          select: { images: true }
        });
  
        if (!ratings) {
          throw new Error('Rating not found or unauthorized');
        }
  
        // Validate that all imageUrls exist in product.image
        const invalidUrls = imageUrls.filter(url => !ratings.images.includes(url));
        if (invalidUrls.length > 0) {
          throw new Error('Some image URLs are invalid');
        }
  
        // Ensure at least one image remains
        const remainingImages = ratings.images.filter(url => !imageUrls.includes(url));
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
        return await prisma.ratings.update({
          where: { id },
          data: {
            images: remainingImages,
            updated_at: new Date()
          },
          include: {
            users: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                profile_url: true,
              },
            },
            products: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          }
        });
      } catch (error) {
        console.error('Remove product images error:', error);
        throw error;
      }
    },
};