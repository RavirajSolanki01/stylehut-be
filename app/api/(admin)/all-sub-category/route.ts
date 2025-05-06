import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { CATEGORY_CONSTANTS, COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { idValidation } from "@/app/utils/validationSchema/common";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    const where: Prisma.sub_categoryWhereInput = {
      is_deleted: false,
    };

    if (categoryId) {
      const categoryIdValidation = idValidation(+categoryId, CATEGORY_CONSTANTS.ID_VALIDATION);
      if (!categoryIdValidation.valid && categoryIdValidation.message) {
        return NextResponse.json(
          errorResponse(categoryIdValidation.message, HttpStatus.BAD_REQUEST),
          { status: HttpStatus.BAD_REQUEST }
        );
      }
      const category = await prisma.category.findFirst({
        where: {
          id: +categoryId,
        },
      });
      if (!category || category.is_deleted) {
        return NextResponse.json(
          errorResponse(CATEGORY_CONSTANTS.NOT_EXISTS_OR_DELETED, HttpStatus.NOT_FOUND),
          { status: HttpStatus.NOT_FOUND }
        );
      }
      where.category_id = +categoryId;
    }

    const subCategories = await prisma.sub_category.findMany({
      where,
    });

    return NextResponse.json(successResponse(COMMON_CONSTANTS.SUCCESS, subCategories), {
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
