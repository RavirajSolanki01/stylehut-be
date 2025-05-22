import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const sizeQuantityService = {
  async createSizeQuantities(dataList: {
    quantity: number;
    product_id?: number;
    variant_id?: number;
    size_id: number;
    custom_product_id?: string;
  }[]) {
    return await Promise.all(
      dataList.map(async (data) => {
        const existingSize = await prisma.size_quantity.findFirst({
          where: {
            variant_id: data.variant_id,
            custom_product_id: data.custom_product_id,
            size_id: data.size_id,
            is_deleted: false,
          },
        });
  
        if (existingSize) {
          return await prisma.size_quantity.update({
            where: { id: existingSize.id },
            data: {
              quantity: data.quantity, // optional: you can also choose not to update quantity
              is_deleted: false,
            },
          });
        }
  
        return await prisma.size_quantity.create({
          data: {
            quantity: data.quantity,
            is_deleted: false,
            custom_product_id: data.custom_product_id,
            variant_id: data.variant_id,
            size_id: data.size_id,
          },
        });
      })
    );
  },

  async updateSizeQuantities(dataList: {
    id: number;
    quantity?: number;
    product_id?: number;
    variant_id?: number;
    size_id?: number;
    custom_product_id?: string;
  }[]) {
    return await Promise.all(
      dataList.map(async (data) => {
        const { id, ...updateFields } = data;
  
        // Ensure the record exists
        const existing = await prisma.size_quantity.findUnique({
          where: { id },
        });
  
        if (!existing || existing.is_deleted) {
          throw new Error(`SizeQuantity with id ${id} not found or deleted.`);
        }
  
        return await prisma.size_quantity.update({
          where: { id },
          data: {
            ...updateFields,
            is_deleted: false, // optional: reset if needed
          },
        });
      })
    );
  },
  
  
async deleteByCustomProductId(customProductId: string) {
  return await prisma.size_quantity.deleteMany({
    where: {
      custom_product_id: customProductId,
    },
  });
},
    
  async getAllSizeQuantities() {
    return await prisma.size_quantity.findMany({
      where: { is_deleted: false },
    });
  },
};
