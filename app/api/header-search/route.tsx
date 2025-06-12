import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    if (!search) {
      return NextResponse.json({ subCategories: [], brands: [] });
    }

    const [subCategoriesType, brands] = await Promise.all([
      prisma.sub_category_type.findMany({
        where: {
          name: { contains: search, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
          sub_category: {
            select: {
              id: true,
              name: true,
            },
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        take: 5,
      }),
      prisma.brand.findMany({
        where: {
          name: { contains: search, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
        },
        take: 5,
      }),
    ]);
    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, {
        subCategoriesType,
        brands,
      }),
      {
        status: HttpStatus.OK,
      }
    );
  } catch (error) {
    console.error("Get category error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      }
    );
  }
}
