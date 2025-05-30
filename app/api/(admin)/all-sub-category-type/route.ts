import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const where: Prisma.sub_category_typeWhereInput = {
      is_deleted: false,
    };

    // if (subCategoryId) {
    //   const subCategoryIdValidation = idValidation(
    //     +subCategoryId,
    //     SUB_CATEGORY_CONSTANTS.ID_VALIDATION
    //   );
    //   if (!subCategoryIdValidation.valid && subCategoryIdValidation.message) {
    //     return NextResponse.json(
    //       errorResponse(subCategoryIdValidation.message, HttpStatus.BAD_REQUEST),
    //       { status: HttpStatus.BAD_REQUEST }
    //     );
    //   }
    //   const subCategory = await prisma.sub_category.findFirst({
    //     where: {
    //       id: +subCategoryId,
    //     },
    //   });
    //   if (!subCategory || subCategory.is_deleted) {
    //     return NextResponse.json(
    //       errorResponse(SUB_CATEGORY_CONSTANTS.NOT_EXISTS_OR_DELETED, HttpStatus.NOT_FOUND),
    //       { status: HttpStatus.NOT_FOUND }
    //     );
    //   }

    //   if (categoryId && subCategory.category_id !== +categoryId) {
    //     return NextResponse.json(
    //       errorResponse(
    //         SUB_CATEGORY_TYPE_CONSTANTS.SUB_CATEGORY_NOT_ASSOCIATED_WITH_CATEGORY,
    //         HttpStatus.BAD_REQUEST
    //       ),
    //       { status: HttpStatus.BAD_REQUEST }
    //     );
    //   }

    //   where.sub_category_id = +subCategoryId;
    // }

    const subCategoryTypes = await prisma.sub_category_type.findMany({
      where,
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
