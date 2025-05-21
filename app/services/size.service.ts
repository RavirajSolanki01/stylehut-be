import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const sizeService = {
  async createSize(data: { name: string; size: string }) {
    const existingSize = await prisma.size_data.findFirst({
      where: {
        name: data.name,
        is_deleted: true,
      },
    });

    if (existingSize) {
      return await prisma.size_data.update({
        where: { id: existingSize.id },
        data: {
          is_deleted: false,
        },
      });
    }

    const { ...cleanedData } = data;
    return await prisma.size_data.create({
      data: {
        name: cleanedData.name,
        is_deleted: false,
        size: cleanedData.size,
      },
    });
  },
  async getAllSizes() {
    return await prisma.size_data.findMany({
      where: { is_deleted: false },
    });
  },
};
