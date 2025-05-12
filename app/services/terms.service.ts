import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const termsService = {
  async createTerms(data: { description: string }) {
    const terms = await prisma.terms_and_conditions.create({
      data: {
        description: data.description,
      },
    });
    return terms;
  },
  async getTerms() {
    const terms = await prisma.terms_and_conditions.findMany();
    return terms;
  },
  async updateTerms(data: { id: number; description: string }) {
    const terms = await prisma.terms_and_conditions.update({
      where: { id: data.id },
      data: { description: data.description },
    });
    return terms;
  },
  async deleteTerms(id: number) {
    const terms = await prisma.terms_and_conditions.delete({
      where: { id: id },
    });
    return terms;
  },
};
