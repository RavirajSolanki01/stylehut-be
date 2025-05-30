import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const userService = {
  async getAllUsers(
    skip: number,
    take: number,
    search: string,
    sortBy: string,
    order: "asc" | "desc",
    roleId?: number,
    genderId?: number,
    role?: string
  ) {

    let orderBy: any;
    switch (sortBy) {
      case "gender":
        orderBy = { gender: { name: order } };
        break;
      case "role":
        orderBy = { role: { name: order } };
        break;
      default:
        orderBy = { [sortBy]: order };
    }

    const where = {
      is_deleted: false,
      ...(search && {
        OR: [
          { first_name: { contains: search, mode: "insensitive" as const } },
          { last_name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { mobile: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(roleId && { role_id: roleId }),
      ...(genderId && { gender_id: genderId }),
      ...(role && {
        role: {
          name: role
        }
      }),
    };

    const [data, total] = await Promise.all([
      prisma.users.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          gender: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.users.count({ where }),
    ]);

    // Remove sensitive information
    const sanitizedData = data.map(({ ...user }) => user);

    return { data: sanitizedData, total };
  },
  async getRoleById(roleId: number) {
    return await prisma.role.findUnique({
      where: { id: roleId },
      select: { name: true },
    });
  },

  async getUserById(id: number) {
    return prisma.users.findUnique({
      where: { id, is_deleted: false },
      include: {
        role: true,
      }
    });
  },

  async exists(id?: string | number, role?: string): Promise<boolean> {
    if (!id) return false;
    let where: {
      id: number;
      is_deleted: boolean;
      role?: { name: string };
    } = {
      id: Number(id),
      is_deleted: false
    }
    if (role) { where['role'] = { name: role }; }
    const count = await prisma.users.count({
      where: where
    });
    return count > 0;
  },

  async updateUserStatus(userId: number, ActiveStatus: boolean = true) {

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: { is_active: ActiveStatus },
    });
    return updatedUser;
  },

};