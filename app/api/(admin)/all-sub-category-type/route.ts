import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const subCategoryId = searchParams.get("subCategoryId");

    const where: Prisma.sub_category_typeWhereInput = {
      is_deleted: false,
    };

    if (subCategoryId) {
      where.sub_category_id = +subCategoryId;
    }

    const subCategoryTypes = await prisma.sub_category_type.findMany({
      where,
      include: {
        sub_category: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        sub_category: {
          category: {
            name: "asc",
          },
        },
      },
    });

    return NextResponse.json(successResponse(COMMON_CONSTANTS.SUCCESS, subCategoryTypes), {
      status: HttpStatus.OK,
    });
  } catch (error) {
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      }
    );
  }
}
