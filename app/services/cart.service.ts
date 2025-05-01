import { PrismaClient } from "@prisma/client";
import { Decimal } from 'decimal.js';
import { AddToCartInput, UpdateCartInput, CartQueryInput } from "../utils/validationSchema/cart.validation";

const prisma = new PrismaClient();

export const cartService = {
  async addToCart(userId: number, data: AddToCartInput) {
    const product = await prisma.products.findFirst({
      where: { id: data.product_id, is_deleted: false }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.quantity < data.quantity) {
      throw new Error('Insufficient stock');
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
        size: data.size || null,
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
        size: data.size,
        color: data.color
      },
      include: {
        product: {
          include: {
            category: true,
            brand: true
          }
        }
      }
    });
  },

  async getCart(userId: number) {
    const cart = await prisma.cart.findFirst({
      where: { user_id: userId, status: 'ACTIVE', is_deleted: false },
      include: {
        user: true,
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
            }
          }
        }
      }
    });

    if (!cart) {
      return { items: [], total: 0, totalAmount: 0 };
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

    if (cartItem.product.quantity < data.quantity) {
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

  async removeFromCart(userId: number, itemId: number) {
    const cartItem = await prisma.cart_items.findFirst({
      where: {
        id: itemId,
        cart: {
          user_id: userId,
          status: 'ACTIVE',
          is_deleted: false
        }
      }
    });

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    return await prisma.cart_items.update({
      where: { id: itemId },
      data: { is_deleted: true }
    });
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
                  name: { contains: search, mode: "insensitive" as const }
                }
              }
            }
          }
        ]
      })
    };

    let orderBy: any;
    switch (sortBy) {
      case "user":
        orderBy = { user: { email: order } };
        break;
      case "category":
        orderBy = { items: {some: {
          product: {
            name: { contains: search, mode: "insensitive" as const }
          }
        }}};
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


    return { data: cartsWithTotals, total };
  }
};
