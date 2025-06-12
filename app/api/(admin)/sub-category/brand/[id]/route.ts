import { NextResponse } from "next/server";
import { brand, PrismaClient } from "@prisma/client";
import { errorResponse } from "@/app/utils/apiResponse";
import { CATEGORY_CONSTANTS, COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { successResponse } from "@/app/utils/apiResponse";

export interface getSubCategoryParams {
  params: Promise<{ id: string }>;
}
const prisma = new PrismaClient();

export async function GET(req: Request, { params }: getSubCategoryParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        errorResponse("Sub Category ID is required", HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const subCategory = await prisma.sub_category.findUnique({
      where: {
        id: +id,
      },
    });

    if (!subCategory || subCategory.is_deleted) {
      return NextResponse.json(
        errorResponse(CATEGORY_CONSTANTS.NOT_EXISTS_OR_DELETED, HttpStatus.NOT_FOUND),
        { status: HttpStatus.NOT_FOUND }
      );
    }

    const brands = await prisma.brand.findMany({
      where: {
        sub_categories: {
          some: {
            id: +id,
          },
        },
      },
    });

    return NextResponse.json(successResponse(COMMON_CONSTANTS.SUCCESS, brands), {
      status: HttpStatus.OK,
    });
  } catch (error) {
    console.error("GET subcategories error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
