import { Prisma, PrismaClient } from "@prisma/client";
import { Decimal } from 'decimal.js';
import { AddToCartInput, UpdateCartInput, CartQueryInput } from "../utils/validationSchema/cart.validation";

const prisma = new PrismaClient();

export const cartService = {
  async addToCart(userId: number, data: AddToCartInput) {
    const [product, sizeQuantity] = await Promise.all([
      prisma.products.findFirst({
        where: {
          id: data.product_id,
          is_deleted: false
        }
      }),
      prisma.size_quantity.findFirst({
        where: {
          id: data.size_quantity_id,
          is_deleted: false,
          products: {
            some: {
              id: data.product_id
            }
          }
        },
        include: {
          size_data: true
        }
      })
    ]);

    if (!product) {
      throw new Error('Product not found');
    }

    if (!sizeQuantity) {
      throw new Error("Selected size not available for this product");
    }

    if (sizeQuantity.quantity < data.quantity) {
      throw new Error(`Only ${sizeQuantity.quantity} items available in size ${sizeQuantity.size_data.size}`);
    }

    // Get or create active cart
    let cart = await prisma.cart.findFirst({
      where: { user_id: userId, status: 'ACTIVE', is_deleted: false }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { user_id: userId, status: 'ACTIVE' }
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cart_items.findFirst({
      where: {
        cart_id: cart.id,
        product_id: data.product_id,
        size_quantity_id: data.size_quantity_id,
        color: data.color || null,
        is_deleted: false
      }
    });

    if (existingItem) {
      // Update quantity if item exists
      return await prisma.cart_items.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + data.quantity },
        include: {
          product: {
            include: {
              category: true,
              brand: true
            }
          },
          size_quantity: {
            include: {
              size_data: true
            }
          }
        }
      });
    }

    // Create new cart item
    return await prisma.cart_items.create({
      data: {
        cart_id: cart.id,
        product_id: data.product_id,
        quantity: data.quantity,
        size_quantity_id: data.size_quantity_id,
        color: data.color
      },
      include: {
        product: {
          include: {
            category: true,
            brand: true
          }
        },
        size_quantity: {
          include: {
            size_data: true
          }
        }
      }
    });
  },

  async getCart(userId: number, params?: CartQueryInput) {
    const cart = await prisma.cart.findFirst({
      where: { user_id: userId, status: 'ACTIVE', is_deleted: false },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            mobile: true,
            address: {
              where: { 
                is_deleted: false,
                is_default: true 
              },
              select: {
                id: true,
                full_name: true,
                phone: true,
                address_line1: true,
                address_line2: true,
                city: true,
                state: true,
                postal_code: true,
                address_type: true,
                is_open_saturday: true,
                is_open_sunday: true
              }
            }
          }
        },
        items: {
          where: { is_deleted: false },
          include: {
            product: {
              include: {
                category: true,
                sub_category: true,
                sub_category_type: true,
                brand: true
              }
            },
            size_quantity: {
              include: {
                size_data: true
              }
            }
          }
        }
      }
    });

    if (!cart) {
      return { 
        items: [], 
        total: 0, 
        totalAmount: 0,
        user: null,
        defaultAddress: null
      };
    }

    const totalAmount = cart.items.reduce((sum, item) => {
      const price = new Decimal(item.product.price.toString());
      const discount = new Decimal(item.product.discount || 0);
      const discountedPrice = price.minus(
        price.times(discount.dividedBy(100))
      );
      
      return sum + discountedPrice.times(item.quantity).toNumber();
    }, 0);

    return {
      user: {
        id: cart.user.id,
        first_name: cart.user.first_name,
        last_name: cart.user.last_name,
        email: cart.user.email,
        mobile: cart.user.mobile
      },
      defaultAddress: cart.user.address[0] || null,
      items: cart.items,
      total: cart.items.length,
      totalAmount
    };
  },

  async updateCartItem(userId: number, itemId: number, data: UpdateCartInput) {
    const cartItem = await prisma.cart_items.findFirst({
      where: { 
        id: itemId,
        cart: {
          user_id: userId,
          status: 'ACTIVE',
          is_deleted: false
        },
        is_deleted: false
      },
      include: { product: true }
    });

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    if (cartItem.product.size_quantity_id < data.quantity) {
      throw new Error('Insufficient stock');
    }

    return await prisma.cart_items.update({
      where: { id: itemId },
      data: { quantity: data.quantity },
      include: {
        product: {
          include: {
            category: true,
            sub_category: true,
            sub_category_type: true,
            brand: true
          }
        }
      }
    });
  },

  async removeFromCart(userId: number, productIds: number[]) {
    // Find active cart
    const cart = await prisma.cart.findFirst({
      where: { 
        user_id: userId, 
        status: 'ACTIVE' 
      },
      include: {
        items: {
          where: { 
            product_id: { in: productIds }
          }
        }
      }
    });

    if (!cart || !cart.items.length) {
      throw new Error('No selected items found in cart');
    }

    // Verify all requested products exist in cart
    const foundProductIds = cart.items.map(item => item.product_id);
    const missingProductIds = productIds.filter(id => !foundProductIds.includes(id));
    
    if (missingProductIds.length) {
      throw new Error(`Products not found in cart: ${missingProductIds.join(', ')}`);
    }

    // Hard delete the cart items
    await prisma.cart_items.deleteMany({
      where: {
        cart_id: cart.id,
        product_id: { in: productIds }
      }
    });

    // If no items left in cart, delete the cart
    const remainingItems = await prisma.cart_items.count({
      where: { cart_id: cart.id }
    });

    if (remainingItems === 0) {
      await prisma.cart.delete({
        where: { id: cart.id }
      });
    }

    return { message: 'Items removed from cart successfully' };
  },
  async getAllCartsForAdmin(params: CartQueryInput) {
    const {
      page = 1,
      pageSize = 10,
      search = "",
      sortBy = "created_at",
      order = "desc"
    } = params;

    const where = {
      is_deleted: false,
      ...(search && {
        OR: [
          { 
            user: {
              OR: [
                { first_name: { contains: search, mode: "insensitive" as const } },
                { last_name: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } }
              ]
            }
          },
          { 
            items: {
              some: {
                product: {
                  OR: [
                    {name: { contains: search, mode: "insensitive" as const }},
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
                  ]
                }
              }
            }
          }
        ]
      })
    };

    let orderBy: Prisma.cartOrderByWithRelationInput;
    switch (sortBy) {
      case "userEmail":
        orderBy = { user: { email: order } };
        break;
      case "userName":
        orderBy = { user: { first_name: order } };
        break;
      case "count":
        orderBy = { items: { _count: order } };
        break;
      default:
        orderBy = { [sortBy]: order };
    }

    const [data, total] = await Promise.all([
      prisma.cart.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: {
            where: { is_deleted: false },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  discount: true,
                  image: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              mobile: true
            }
          }
        }
      }),
      prisma.cart.count({ where })
    ]);

    // Calculate totals for each cart
    const cartsWithTotals = data.map(cart => ({
      ...cart,
      totalItems: cart.items.length,
      totalAmount: cart.items.reduce((sum, item) => {
        const price = new Decimal(item.product.price.toString());
        const discount = new Decimal(item.product.discount || 0);
        const discountedPrice = price.minus(
          price.times(discount.dividedBy(100))
        );
        return sum + discountedPrice.times(item.quantity).toNumber();
      }, 0)
    }));

    const sortedData = cartsWithTotals.sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return order === "desc" 
          ? b.totalAmount - a.totalAmount
          : a.totalAmount - b.totalAmount;
        default:
          return 0;
      }
    });

    return { data: sortedData, total };
  },

  async getAllCartsItemsForAdmin(params: CartQueryInput) {
    const {
      page = 1,
      pageSize = 10,
      search = "",
      sortBy = "created_at",
      order = "desc"
    } = params;
  
    // First get the grouped data using Prisma's groupBy
    const groupedItems = await prisma.cart_items.groupBy({
      by: ['product_id'],
      where: {
        is_deleted: false,
        ...(search && {
          OR: [
            {
              product: {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { description: { contains: search, mode: "insensitive" as const } },
                  { category: { name: { contains: search, mode: "insensitive" as const } } },
                  { sub_category: { name: { contains: search, mode: "insensitive" as const } } },
                  { sub_category_type: { name: { contains: search, mode: "insensitive" as const } } },
                  { brand: { name: { contains: search, mode: "insensitive" as const } } }
                ]
              }
            }
          ]
        })
      },
      _sum: {
        quantity: true
      },
      _count: {
        cart_id: true
      }
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
          in: paginatedProductIds
        }
      },
      include: {
        category: true,
        sub_category: true,
        sub_category_type: true,
        brand: true,
        cart_items: {
          where: {
            is_deleted: false
          },
          include: {
            cart: {
              include: {
                user: {
                  select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });
  
    // Format the response
    const formattedData = detailedProducts.map(product => {
      const groupedItem = groupedItems.find(item => item.product_id === product.id);
      const totalQuantity = groupedItem?._sum.quantity || 0;
      const uniqueUsers = groupedItem?._count.cart_id || 0;
  
      // Get unique users who added this product
      const users = [...new Set(product.cart_items.map(item => item.cart.user))];
  
      return {
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          discount: product.discount,
          image: product.image,
          category: product.category,
          sub_category: product.sub_category,
          sub_category_type: product.sub_category_type,
          brand: product.brand
        },
        total_quantity: totalQuantity,
        unique_users_count: uniqueUsers,
        users: users,
        total_amount: Number(product.price) * (1 - (product.discount || 0) / 100) * totalQuantity
      };
    });
  
    // Apply sorting
    const sortedData = formattedData.sort((a, b) => {
      switch (sortBy) {
        case "product":
          return order === "desc" 
            ? b.product.name.localeCompare(a.product.name)
            : a.product.name.localeCompare(b.product.name);
        case "quantity":
          return order === "desc"
            ? b.total_quantity - a.total_quantity
            : a.total_quantity - b.total_quantity;
        case "amount":
          return order === "desc"
            ? b.total_amount - a.total_amount
            : a.total_amount - b.total_amount;
        case "users":
          return order === "desc"
            ? b.unique_users_count - a.unique_users_count
            : a.unique_users_count - b.unique_users_count;
        default:
          return 0;
      }
    });
  
    return {
      data: sortedData,
      total
    };
  },

  async addWishlistItemsToCart(userId: number, productIds: number[]) {
    // Get active wishlisted items
    const wishlistedItems = await prisma.wishlist.findMany({
      where: {
        user_id: userId,
        product_id: { in: productIds },
        is_deleted: false
      },
      include: {
        products: {
          select: {
            id: true,
            size_quantity_id: true
          }
        }
      }
    });

    if (!wishlistedItems.length) {
      throw new Error('No items found in wishlist');
    }

    // Verify all requested products exist in wishlist
    const foundProductIds = wishlistedItems.map(item => item.product_id);
    const missingProductIds = productIds.filter(id => !foundProductIds.includes(id));
    
    if (missingProductIds.length) {
      throw new Error(`Products not found in wishlist: ${missingProductIds.join(', ')}`);
    }

    // Get or create active cart
    let cart = await prisma.cart.findFirst({
      where: { user_id: userId, status: 'ACTIVE', is_deleted: false }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { user_id: userId, status: 'ACTIVE' }
      });
    }

    // Add each wishlisted item to cart
    const cartItemPromises = wishlistedItems.map(async (item) => {
      // Check if item already exists in cart
      const existingCartItem = await prisma.cart_items.findFirst({
        where: {
          cart_id: cart.id,
          product_id: item.product_id,
          is_deleted: false
        }
      });

      if (existingCartItem) {
        // Update quantity if item exists
        return prisma.cart_items.update({
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + 1 }
        });
      }

      // Create new cart item
      return prisma.cart_items.create({
        data: {
          cart_id: cart.id,
          product_id: item.product_id,
          quantity: 1
        }
      });
    });

    await Promise.all(cartItemPromises);

    return this.getCart(userId);
  },

  async moveCartItemsToWishlist(userId: number, productIds: number[]) {
    // Get active cart items
    const cart = await prisma.cart.findFirst({
      where: { 
        user_id: userId, 
        status: 'ACTIVE', 
        is_deleted: false 
      },
      include: {
        items: {
          where: { 
            is_deleted: false,
            product_id: { in: productIds }
          }
        }
      }
    });
  
    if (!cart || !cart.items.length) {
      throw new Error('No selected items found in cart');
    }
  
    // Verify all requested products exist in cart
    const foundProductIds = cart.items.map(item => item.product_id);
    const missingProductIds = productIds.filter(id => !foundProductIds.includes(id));
    
    if (missingProductIds.length) {
      throw new Error(`Products not found in cart: ${missingProductIds.join(', ')}`);
    }
  
    return await prisma.$transaction(async (tx) => {
      // Add each cart item to wishlist
      const wishlistPromises = cart.items.map(async (item) => {
        // Check if item already exists in wishlist
        const existingWishlistItem = await tx.wishlist.findUnique({
          where: {
            user_id_product_id: {
              user_id: userId,
              product_id: item.product_id
            }
          }
        });
  
        if (existingWishlistItem) {
          // Restore if soft deleted
          if (existingWishlistItem.is_deleted) {
            return tx.wishlist.update({
              where: { id: existingWishlistItem.id },
              data: { is_deleted: false }
            });
          }
          return existingWishlistItem;
        }
  
        // Create new wishlist item
        return tx.wishlist.create({
          data: {
            user_id: userId,
            product_id: item.product_id
          }
        });
      });
  
      // Soft delete selected cart items
      await tx.cart_items.updateMany({
        where: {
          cart_id: cart.id,
          product_id: { in: productIds },
          is_deleted: false
        },
        data: { is_deleted: true }
      });
  
      return Promise.all(wishlistPromises);
    });
  },

};