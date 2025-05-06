import { PrismaClient } from "@prisma/client";
import { CreateAddressInput, UpdateAddressInput, AddressQueryInput } from "../utils/validationSchema/address.validation";

const prisma = new PrismaClient();

export const addressService = {
  async createAddress(userId: number, data: CreateAddressInput) {
    const userExists = await prisma.users.findFirst({
      where: {
        id: userId,
        is_deleted: false
      }
    });

    if (!userExists) {
      throw new Error('User not found');
    }

    // If this is default address, remove default from other addresses
    if (data.is_default) {
      await prisma.address.updateMany({
        where: { user_id: userId, is_deleted: false },
        data: { is_default: false }
      });
    }

    const weekendData = data.address_type === 'OFFICE' 
      ? {
          is_open_saturday: data.is_open_saturday ?? false,
          is_open_sunday: data.is_open_sunday ?? false
        }
      : {
          is_open_saturday: true,
          is_open_sunday: true
        };


    return await prisma.address.create({
      data: {
        ...data,
        ...weekendData,
        user_id: userId
      }
    });
  },

  async getAddresses(userId: number, params: AddressQueryInput) {
    const {
      page = 1,
      pageSize = 10,
      search = "",
      sortBy = "created_at",
      order = "desc"
    } = params;

    const where = {
      user_id: userId,
      is_deleted: false,
      ...(search && {
        OR: [
          { full_name: { contains: search, mode: "insensitive" as const } },
          { address_line1: { contains: search, mode: "insensitive" as const } },
          { city: { contains: search, mode: "insensitive" as const } },
          { state: { contains: search, mode: "insensitive" as const } },
          { postal_code: { contains: search, mode: "insensitive" as const } }
        ]
      })
    };
    const orderBy = { [sortBy]: order };


    const [data, total] = await Promise.all([
      prisma.address.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.address.count({ where })
    ]);

    return { data, total };
  },

  async getAddressById(userId: number, id: number) {
    return await prisma.address.findFirst({
      where: {
        id,
        user_id: userId,
        is_deleted: false
      }
    });
  },

  async updateAddress(userId: number, id: number, data: UpdateAddressInput) {
    const address = await this.getAddressById(userId, id);
    if (!address) {
      throw new Error('Address not found');
    }

    // If setting as default, remove default from other addresses
    if (data.is_default) {
      await prisma.address.updateMany({
        where: { 
          user_id: userId, 
          is_deleted: false,
          id: { not: id }
        },
        data: { is_default: false }
      });
    }

    let updateData = { ...data };
    if (data.address_type === 'HOME') {
      updateData.is_open_saturday = true;
      updateData.is_open_sunday = true;
    }

    return await prisma.address.update({
      where: { id },
      data
    });
  },

  async deleteAddress(userId: number, id: number) {
    const address = await this.getAddressById(userId, id);
    if (!address) {
      throw new Error('Address not found');
    }

    return await prisma.address.update({
      where: { id },
      data: { is_deleted: true }
    });
  }
};