import { PrismaClient } from "@prisma/client";
import {
  CreateWishlistInput,
  WishlistQueryInput,
} from "../utils/validationSchema/wishlist.validation";

const prisma = new PrismaClient();

export const wishlistService = {
  async addToWishlist(userId: number, data: CreateWishlistInput) {
    const [product] = await Promise.all([
      prisma.products.findFirst({
        where: {
          id: data.product_id,
          is_deleted: false,
        },
      }),
    ]);
    if (!product) {
      throw new Error("Product not found with the given ID");
    }

    // Check if the product is already in the wishlist
    const existingWishlist = await prisma.wishlist.findFirst({
      where: {
        user_id: userId,
        product_id: data.product_id,
        is_deleted: false,
      },
    });
    if (existingWishlist) {
      return {
        message: "Added to wishlist",
        data: existingWishlist,
        isWishlisted: true,
      };
    }

    return await prisma.wishlist.create({
      data: {
        user_id: userId,
        product_id: data.product_id,
        is_deleted: false,
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            price: true,
            discount: true,
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
        },
      },
    });
  },

  async getWishlist(userId: number, params: WishlistQueryInput) {
    const { page = 1, pageSize = 10, sortBy = "created_at", order = "desc" } = params;

    let orderBy: any;
    switch (sortBy) {
      case "name":
        orderBy = { product: { name: order } };
        break;
      case "category":
        orderBy = { product: { category: { name: order } } };
        break;
      case "sub_category":
        orderBy = { product: { sub_category: { name: order } } };
        break;
      case "sub_category_type":
        orderBy = { product: { sub_category_type: { name: order } } };
        break;
      case "brand":
        orderBy = { product: { brand: { name: order } } };
        break;
      default:
        orderBy = { [sortBy]: order };
    }

    const where = {
      user_id: userId,
      is_deleted: false,
    };

    const [data, total] = await Promise.all([
      prisma.wishlist.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          products: {
            select: {
              id: true,
              name: true,
              description: true,
              image: true,
              price: true,
              discount: true,
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
          },
        },
      }),
      prisma.wishlist.count({ where }),
    ]);

    return { data, total };
  },

  async checkWishlist(userId: number, productId: number) {
    const wishlist = await prisma.wishlist.findFirst({
      where: {
        user_id: userId,
        product_id: productId,
        is_deleted: false,
      },
    });
    return !!wishlist;
  },

  async removeFromWishlist(userId: number, productId: number) {
    return await prisma.wishlist.update({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: productId,
        },
      },
      data: {
        is_deleted: true,
      },
    });
  },

  async toggleWishlist(userId: number, data: CreateWishlistInput) {
    // Check if item exists in wishlist (including soft-deleted items)
    const [product] = await Promise.all([
      prisma.products.findFirst({
        where: {
          id: data.product_id,
          is_deleted: false,
        },
      }),
    ]);
    if (!product) {
      throw new Error("Product not found with the given ID");
    }

    const existingItem = await prisma.wishlist.findUnique({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: data.product_id,
        },
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            price: true,
            discount: true,
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
        },
      },
    });

    if (existingItem) {
      if (data.isSoftAdd) {
        // Soft add to wishlist
        return {
          data: existingItem,
          message: "Added to wishlist",
          isWishlisted: existingItem.is_deleted,
        };
      }

      // Toggle is_deleted status
      const updatedWishlist = await prisma.wishlist.update({
        where: {
          user_id_product_id: {
            user_id: userId,
            product_id: data.product_id,
          },
        },
        data: {
          is_deleted: !existingItem.is_deleted,
        },
        include: {
          products: {
            select: {
              id: true,
              name: true,
              description: true,
              image: true,
              price: true,
              discount: true,
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
          },
        },
      });

      return {
        data: updatedWishlist,
        message: updatedWishlist.is_deleted ? "Removed from wishlist" : "Added to wishlist",
        isWishlisted: !updatedWishlist.is_deleted,
      };
    }

    // Create new wishlist item
    const newWishlist = await prisma.wishlist.create({
      data: {
        user_id: userId,
        product_id: data.product_id,
        is_deleted: false,
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            price: true,
            discount: true,
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
        },
      },
    });

    return {
      data: newWishlist,
      message: "Added to wishlist",
      isWishlisted: true,
    };
  },

  async getAllWishlistItems(params: WishlistQueryInput) {
    const { page = 1, pageSize = 10, search = "", sortBy = "created_at", order = "desc" } = params;

    const groupedItems = await prisma.wishlist.groupBy({
      by: ["product_id"],
      where: {
        is_deleted: false,
        ...(search && {
          OR: [
            {
              products: {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
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
                  { brand: { name: { contains: search, mode: "insensitive" as const } } },
                ],
              },
            },
          ],
        }),
      },
      _count: {
        user_id: true,
      },
    });

    // Get total count for pagination
    const total = groupedItems.length;

    // Get detailed product information for the paginated subset
    const paginatedProductIds = groupedItems
      .slice((page - 1) * pageSize, page * pageSize)
      .map(item => item.product_id);

    const detailedProducts = await prisma.products.findMany({
      where: {
        id: {
          in: paginatedProductIds,
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
        wishlist: {
          where: {
            is_deleted: false,
          },
          include: {
            users: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                role: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Format the response
    const formattedData = detailedProducts.map(product => {
      const groupedItem = groupedItems.find(item => item.product_id === product.id);
      const uniqueUsers = groupedItem?._count.user_id || 0;

      // Get unique users who wishlisted this product
      const users = [...new Set(product.wishlist.map(item => item.users))];

      return {
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          discount: product.discount,
          image: product.image,
          // quantity: product.quantity,
          sub_category_type: {
            name: product.sub_category_type.name,
            sub_category: {
              name: product.sub_category_type.sub_category.name,
              category: {
                name: product.sub_category_type.sub_category.category.name,
              },
            },
          },
          brand: product.brand,
        },
        unique_users_count: uniqueUsers,
        users: users,
      };
    });

    // Apply sorting
    const sortedData = formattedData.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return order === "desc"
            ? b.product.name.localeCompare(a.product.name)
            : a.product.name.localeCompare(b.product.name);
        case "users":
          return order === "desc"
            ? b.unique_users_count - a.unique_users_count
            : a.unique_users_count - b.unique_users_count;
        case "price":
          return order === "desc"
            ? Number(b.product.price) - Number(a.product.price)
            : Number(a.product.price) - Number(b.product.price);
        default:
          return 0;
      }
    });

    return { data: sortedData, total };
  },
};
