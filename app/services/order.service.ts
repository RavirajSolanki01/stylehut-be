import { PrismaClient, Prisma } from "@prisma/client";
import { OrderStatus, ReturnRequestStatus } from "@/app/types/order.types";
import {
  CreateOrderInput,
  UpdateOrderAdminInput,
  CreateReturnRequestInput,
  OrderQueryInput,
  ApproveReturnInput,
  ProcessReturnInput,
  ProcessReturnQCInput,
} from "../utils/validationSchema/order.validation";
import { Decimal } from "@prisma/client/runtime/library";
import { File } from "formidable";
import { uploadToCloudinary } from "@/app/utils/cloudinary";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export const orderService = {
  async createOrder(userId: number, data: CreateOrderInput) {
    // Validate addresses belong to user
    const addresses = await Promise.all([
      prisma.address.findFirst({
        where: { id: data.shipping_address_id, user_id: userId, is_deleted: false },
      }),
      prisma.address.findFirst({
        where: { id: data.billing_address_id, user_id: userId, is_deleted: false },
      }),
    ]);

    if (!addresses[0] || !addresses[1]) {
      throw new Error("Invalid address");
    }

    // Get active cart
    const cart = await prisma.cart.findFirst({
      where: { user_id: userId, status: "ACTIVE", is_deleted: false },
      include: {
        items: {
          where: { is_deleted: false },
          include: {
            product: true,
            size_quantity: {
              include: {
                size_data: true,
              },
            },
          },
        },
      },
    });

    if (!cart || !cart.items.length) {
      throw new Error("Cart is empty");
    }

    // Calculate totals
    const totalAmount = cart.items.reduce((sum, item) => {
      const price = new Decimal(item.product.price.toString());
      const discount = new Decimal(item.product.discount || 0);
      const discountedPrice = price.minus(price.times(discount.dividedBy(100)));

      return sum + discountedPrice.times(item.quantity).toNumber();
    }, 0);
    const discountAmount = cart.items.reduce((sum, item) => {
      const price = new Decimal(item.product.price.toString());
      const discount = new Decimal(item.product.discount || 0);
      const discountedPrice = price.minus(price.times(discount.dividedBy(100)));
      return sum + price.minus(discountedPrice).times(item.quantity).toNumber();
    }, 0);
    const shippingCharge = new Decimal(99); // You can make this configurable

    const orderItems = cart.items.map(item => {
      const price = new Decimal(item.product.price.toString());
      const discount = new Decimal(item.product.discount || 0);
      const discountedPrice = price.minus(price.times(discount.dividedBy(100)));

      return {
        product_id: item.product_id,
        quantity: item.quantity,
        color: item.color,
        price: price,
        discount: item.product.discount,
        final_price: discountedPrice,
        size_quantity_id: item.size_quantity_id,
      };
    });

    const finalAmount = totalAmount + shippingCharge.toNumber();

    // Generate order number
    const orderCount = await prisma.orders.count();
    const orderNumber = `ORD-${new Date().getFullYear()}-${(orderCount + 1).toString().padStart(4, "0")}`;

    // Create order using transaction
    return await prisma.$transaction(
      async tx => {
        // First soft delete cart items
        await tx.cart_items.updateMany({
          where: {
            cart: { user_id: userId, status: "ACTIVE", is_deleted: false },
            is_deleted: false,
          },
          data: { is_deleted: true },
        });

        await tx.cart.updateMany({
          where: { user_id: userId, status: "ACTIVE", is_deleted: false },
          data: {
            status: `CONVERTED_TO_ORDER`,
            is_deleted: true,
            converted_at: new Date(),
            updated_at: new Date(),
          },
        });

        // Create order
        const order = await tx.orders.create({
          data: {
            user_id: userId,
            order_number: orderNumber,
            total_amount: totalAmount,
            discount_amount: discountAmount,
            shipping_charge: shippingCharge,
            final_amount: finalAmount,
            payment_method: data.payment_method,
            shipping_address_id: data.shipping_address_id,
            billing_address_id: data.billing_address_id,
            items: {
              create: orderItems,
            },
            timeline: {
              create: {
                status: OrderStatus.PENDING,
                comment: "Order placed successfully",
              },
            },
          },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    category: true,
                    sub_category: true,
                    sub_category_type: true,
                    brand: true,
                  },
                },
                size_quantity: true,
              },
            },
            shipping_address: true,
            billing_address: true,
            timeline: true,
          },
        });

        // Update product quantities
        await Promise.all(
          orderItems.map(async item => {
            if (!item.size_quantity_id) {
              throw new Error(`Size is required for product ${item.product_id}`);
            }

            // Find the specific size_quantity record
            const sizeQuantity = await tx.size_quantity.findFirst({
              where: {
                id: item.size_quantity_id,
                is_deleted: false,
              },
              include: {
                size_data: true,
              },
            });

            if (!sizeQuantity) {
              throw new Error(
                `Size ${item.size_quantity_id} not found for product ${item.product_id}`
              );
            }

            if (sizeQuantity.quantity < item.quantity) {
              throw new Error(
                `Insufficient quantity available for product ${item.product_id} in size ${item.size_quantity_id}`
              );
            }

            // Update the size_quantity record
            await tx.size_quantity.update({
              where: {
                id: sizeQuantity.id,
              },
              data: {
                quantity: {
                  decrement: item.quantity,
                },
              },
            });
          })
        );

        return order;
      },
      {
        timeout: 10000, // Increase timeout to 10 seconds
        maxWait: 5000, // Maximum time to wait for transaction to start
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, // Add isolation level
      }
    );
  },

  async getOrders(userId: number, params: OrderQueryInput) {
    const where = {
      user_id: userId,
      is_deleted: false,
      ...(params.status && { order_status: params.status }),
      ...(params.payment_status && { payment_status: params.payment_status }),
      ...(params.startDate &&
        params.endDate && {
          created_at: {
            gte: new Date(params.startDate),
            lte: new Date(params.endDate),
          },
        }),
    };

    const [data, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        orderBy: { [params.sortBy || "created_at"]: params.order || "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                  sub_category: true,
                  sub_category_type: true,
                  brand: true,
                },
              },
              size_quantity: {
                include: {
                  size_data: true,
                },
              },
            },
          },
          shipping_address: true,
          billing_address: true,
          timeline: {
            orderBy: { created_at: "desc" },
          },
          return_request: true,
        },
      }),
      prisma.orders.count({ where }),
    ]);

    return { data, total };
  },

  async getAdminOrders(params: OrderQueryInput) {
    const sanitizedSearch = params.search?.trim();

    const where: any = {
      is_deleted: false,
      ...(params.status && { order_status: params.status }),
      ...(params.payment_status && { payment_status: params.payment_status }),
      ...(params.startDate &&
        params.endDate && {
          created_at: {
            gte: new Date(params.startDate),
            lte: new Date(params.endDate),
          },
        }),
      ...(sanitizedSearch && {
        OR: [
          { id: { contains: sanitizedSearch, mode: "insensitive" } },
          {
            shipping_address: {
              name: { contains: sanitizedSearch, mode: "insensitive" },
            },
          },
          {
            billing_address: {
              name: { contains: sanitizedSearch, mode: "insensitive" },
            },
          },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        orderBy: { [params.sortBy || "created_at"]: params.order || "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                  sub_category: true,
                  sub_category_type: true,
                  brand: true,
                },
              },
              size_quantity: {
                include: {
                  size_data: true,
                },
              },
            },
          },
          shipping_address: true,
          billing_address: true,
          timeline: {
            orderBy: { created_at: "desc" },
          },
          return_request: true,
        },
      }),
      prisma.orders.count({ where }),
    ]);

    return { data, total };
  },

  async getOrderById(userId: number, orderId: number) {
    const order = await prisma.orders.findFirst({
      where: {
        id: orderId,
        user_id: userId,
        is_deleted: false,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                sub_category: true,
                sub_category_type: true,
                brand: true,
              },
            },
            size_quantity: {
              include: {
                size_data: true,
              },
            },
          },
        },
        shipping_address: true,
        billing_address: true,
        timeline: {
          orderBy: { created_at: "desc" },
        },
        return_request: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  },

  async cancelOrder(userId: number, orderId: number, reason: string) {
    const order = await this.getOrderById(userId, orderId);

    if (order.order_status !== OrderStatus.PENDING) {
      throw new Error("Order cannot be cancelled at this stage");
    }

    return await prisma.$transaction(async tx => {
      // Update order status
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: {
          order_status: OrderStatus.CANCELLED,
          cancelled_at: new Date(),
          cancellation_reason: reason,
          timeline: {
            create: {
              status: OrderStatus.CANCELLED,
              comment: reason,
            },
          },
        },
        include: {
          items: true,
          timeline: {
            orderBy: { created_at: "desc" },
          },
        },
      });

      // Restore product quantities
      await Promise.all(
        order.items.map(async item => {
          if (!item.size_quantity_id) {
            throw new Error(`Size is required for product ${item.product_id}`);
          }

          // Find the specific size_quantity record
          const sizeQuantity = await tx.size_quantity.findFirst({
            where: {
              id: item.size_quantity_id,
              is_deleted: false,
            },
            include: {
              size_data: true,
            },
          });

          if (!sizeQuantity) {
            throw new Error(
              `Size ${item.size_quantity_id} not found for product ${item.product_id}`
            );
          }

          // if (sizeQuantity.quantity < item.quantity) {
          //   throw new Error(`Insufficient quantity available for product ${item.product_id} in size ${item.size_quantity_id}`);
          // }

          // Update the size_quantity record
          await tx.size_quantity.update({
            where: {
              id: sizeQuantity.id,
            },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });
        })
      );

      return updatedOrder;
    });
  },

  async createReturnRequest(
    userId: number,
    orderId: number,
    data: CreateReturnRequestInput,
    files: File[]
  ) {
    const order = await this.getOrderById(userId, orderId);

    if (order.order_status !== OrderStatus.DELIVERED) {
      throw new Error("Order must be delivered to initiate return");
    }

    const daysSinceDelivery = Math.floor(
      (Date.now() - order.delivered_at!.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDelivery > 7) {
      throw new Error("Return window has expired");
    }

    // Upload images to Cloudinary
    const imageUrls =
      files && files.length > 0
        ? await Promise.all(files.map(file => uploadToCloudinary(file.filepath)))
        : [];

    return await prisma.$transaction(async tx => {
      // Create return request
      const returnRequest = await tx.return_request.create({
        data: {
          order_id: orderId,
          reason: data.reason,
          description: data.description,
          images: imageUrls,
          refund_amount: order.final_amount,
        },
      });

      // Update order status
      await tx.orders.update({
        where: { id: orderId },
        data: {
          order_status: OrderStatus.RETURN_REQUESTED,
          timeline: {
            create: {
              status: OrderStatus.RETURN_REQUESTED,
              comment: `Return initiated: ${data.reason}`,
            },
          },
        },
      });

      return returnRequest;
    });
  },

  async updateOrderStatus(orderId: number, data: UpdateOrderAdminInput) {
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        timeline: {
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Validate status transition
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.RETURN_REQUESTED],

      [OrderStatus.RETURN_REQUESTED]: [OrderStatus.RETURN_APPROVED, OrderStatus.RETURN_REJECTED],
      [OrderStatus.RETURN_APPROVED]: [OrderStatus.RETURN_PICKUP_SCHEDULED],

      [OrderStatus.RETURN_PICKUP_SCHEDULED]: [OrderStatus.RETURN_PICKED],
      [OrderStatus.RETURN_PICKED]: [OrderStatus.RETURN_RECEIVED],

      [OrderStatus.RETURN_RECEIVED]: [OrderStatus.REFUND_INITIATED],
      [OrderStatus.REFUND_INITIATED]: [OrderStatus.REFUND_COMPLETED],
      [OrderStatus.RETURN_REJECTED]: [],
      [OrderStatus.REFUND_COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[order.order_status as keyof typeof OrderStatus].includes(data.status)) {
      throw new Error(`Cannot transition from ${order.order_status} to ${data.status}`);
    }

    const updateData: any = {
      order_status: data.status,
      timeline: {
        create: {
          status: data.status,
          comment: data.comment || "",
        },
      },
    };

    // Add conditional fields
    if (data.tracking_number) {
      updateData.tracking_number = data.tracking_number;
      // "tracking_number": "MYN123456789", // TODO :: Add tracking number
    }

    if (data.expected_delivery) {
      updateData.expected_delivery = new Date(data.expected_delivery);
    }

    if (data.status === OrderStatus.DELIVERED) {
      updateData.delivered_at = new Date();
    }

    if (data.status === OrderStatus.CANCELLED) {
      updateData.cancelled_at = new Date();
    }

    return await prisma.$transaction(async tx => {
      // Update order status
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: updateData,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          timeline: {
            orderBy: { created_at: "desc" },
          },
          shipping_address: true,
          billing_address: true,
          user: {
            select: {
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      // Handle cancellation
      if (data.status === OrderStatus.CANCELLED) {
        await Promise.all(
          order.items.map(async item => {
            if (!item.size_quantity_id) {
              throw new Error(`Size is required for product ${item.product_id}`);
            }

            // Find the specific size_quantity record
            const sizeQuantity = await tx.size_quantity.findFirst({
              where: {
                id: item.size_quantity_id,
                is_deleted: false,
              },
              include: {
                size_data: true,
              },
            });

            if (!sizeQuantity) {
              throw new Error(
                `Size ${item.size_quantity_id} not found for product ${item.product_id}`
              );
            }

            if (sizeQuantity.quantity < item.quantity) {
              throw new Error(
                `Insufficient quantity available for product ${item.product_id} in size ${item.size_quantity_id}`
              );
            }

            // Update the size_quantity record
            await tx.size_quantity.update({
              where: {
                id: sizeQuantity.id,
              },
              data: {
                quantity: {
                  decrement: item.quantity,
                },
              },
            });
          })
        );
      }

      return updatedOrder;
    });
  },

  async approveReturn(orderId: number, data: ApproveReturnInput) {
    return await prisma.$transaction(async tx => {
      await tx.return_request.update({
        where: { order_id: orderId },
        data: {
          pickup_date: data.pickup_date,
        },
      });

      await tx.orders.update({
        where: { id: orderId },
        data: {
          order_status: OrderStatus.RETURN_APPROVED,
          timeline: {
            create: {
              status: OrderStatus.RETURN_APPROVED,
              comment: "Return request approved",
            },
          },
        },
      });
    });
  },

  async rejectReturn(orderId: number, reason: string) {
    return await prisma.$transaction(async tx => {
      await tx.return_request.update({
        where: { order_id: orderId },
        data: {
          rejection_reason: reason,
        },
      });

      await tx.orders.update({
        where: { id: orderId },
        data: {
          order_status: OrderStatus.RETURN_REJECTED,
          timeline: {
            create: {
              status: OrderStatus.RETURN_REJECTED,
              comment: `Return rejected: ${reason}`,
            },
          },
        },
      });
    });
  },

  async processQualityCheck(returnRequestId: number, data: ProcessReturnQCInput) {
    const refundID = uuidv4();

    return await prisma.$transaction(async tx => {
      const returnRequest = await tx.return_request.update({
        where: { id: returnRequestId },
        data: {
          qc_status: data.status,
          qc_notes: data.notes,
          status: data.status ? ReturnRequestStatus.QC_PASSED : ReturnRequestStatus.QC_FAILED,
        },
        include: { order: true },
      });

      if (data.status) {
        // If QC passed, initiate refund
        const refundData = {
          amount: Number(returnRequest.refund_amount),
          paymentMethod: returnRequest.order.payment_method,
          orderReference: returnRequest.order.order_number,
        };

        // const refundResponse = await paymentService.initiateRefund(refundData);

        // Update return request with refund details
        await tx.return_request.update({
          where: { id: returnRequestId },
          data: {
            status: ReturnRequestStatus.REFUND_INITIATED,
            refund_id: refundID, // Replace with actual refund ID from payment gateway
            // refund_id: refundResponse.refundId
          },
        });

        // Update order status
        await tx.orders.update({
          where: { id: returnRequest.order_id },
          data: {
            order_status: OrderStatus.REFUND_INITIATED,
            timeline: {
              create: {
                status: OrderStatus.REFUND_INITIATED,
                comment: `Refund initiated with ID: ${refundID}`,
              },
            },
          },
        });
      }

      return returnRequest;
    });
  },

  async processReturnRefund(orderId: number, data: ProcessReturnInput) {
    return await prisma.$transaction(async tx => {
      await tx.return_request.update({
        where: { order_id: orderId },
        data: {
          received_condition: data.condition,
          qc_notes: data.notes,
          refund_id: data.refund_id,
          status: "INITIATED",
        },
      });

      await tx.orders.update({
        where: { id: orderId },
        data: {
          order_status: OrderStatus.REFUND_INITIATED,
          timeline: {
            create: {
              status: OrderStatus.REFUND_INITIATED,
              comment: `Refund initiated: ${data.refund_id}`,
            },
          },
        },
      });
    });
  },

  async updateRefundStatus(returnRequestId: number, refundId: string, status: string) {
    return await prisma.$transaction(async tx => {
      const returnRequest = await tx.return_request.update({
        where: { id: returnRequestId },
        data: {
          status: ReturnRequestStatus.REFUND_COMPLETED,
          refunded_at: new Date(),
        },
      });

      await tx.orders.update({
        where: { id: returnRequest.order_id },
        data: {
          order_status: OrderStatus.REFUND_COMPLETED,
          timeline: {
            create: {
              status: OrderStatus.REFUND_COMPLETED,
              comment: `Refund completed for return request`,
            },
          },
        },
      });

      return returnRequest;
    });
  },
};
