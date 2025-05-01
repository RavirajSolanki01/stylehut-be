import { PrismaClient } from "@prisma/client";
import { CreateGenderInput, UpdateGenderInput } from "@/app/utils/validationSchema/gender.validation";

const prisma = new PrismaClient();

export const genderService = {
  async createGender(data: CreateGenderInput) {

    const existingGender = await prisma.gender.findFirst({
      where: {
        name: data.name,
        is_deleted: true,
      },
    });

    if (existingGender) {
      return await prisma.gender.update({
        where: { id: existingGender.id },
        data: {
          is_deleted: false,
          updated_at: new Date(),
        },
      });
    }

    return await prisma.gender.create({
      data: {
        ...data,
        is_deleted: false,
      },
    });
  },

  async getAllGenders(
    skip = 0,
    take = 10,
    search = "",
    sortBy = "create_at",
    order: "asc" | "desc" = "desc"
  ) {
    const where = {
      is_deleted: false,
      ...(search && {
        name: {
          contains: search,
          mode: "insensitive" as const,
        },
      }),
    };

    const [data, total] = await Promise.all([
      prisma.gender.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip,
        take,
      }),
      prisma.gender.count({ where }),
    ]);

    return { data, total };
  },

  async getGenderById(id: number) {
    return await prisma.gender.findFirst({
      where: {
        id,
        is_deleted: false,
      },
    });
  },

  async updateGender(id: number, data: UpdateGenderInput) {
    return await prisma.gender.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  },

  async deleteGender(id: number) {
    return await prisma.gender.update({
      where: { id },
      data: {
        is_deleted: true,
        updated_at: new Date(),
      },
    });
  },
};