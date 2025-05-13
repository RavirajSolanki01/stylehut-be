import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const policyService = {
  async createPolicy(data: { description: string }) {
    const policy = await prisma.privacy_policy.create({ data });
    return policy;
  },
  async getPolicy() {
    const policy = await prisma.privacy_policy.findMany();
    return policy;
  },
  async updatePolicy(data: { id: number; description: string }) {
    const policy = await prisma.privacy_policy.update({
      where: { id: data.id },
      data: { description: data.description },
    });
    return policy;
  },
  async deletePolicy(id: number) {
    const policy = await prisma.privacy_policy.delete({ where: { id } });
    return policy;
  },
};
