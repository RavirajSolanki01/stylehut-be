import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCategoryParams } from "@/app/types/category";
import { idValidation } from "@/app/utils/validationSchema/common";
import { editCategoryPayload, getSubCategoryParams } from "@/app/types/sub-category";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import {
  SUB_CATEGORY_CONSTANTS,
  COMMON_CONSTANTS,
  CATEGORY_CONSTANTS,
} from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { addEditSubCategoryValidation } from "@/app/utils/validationSchema/sub-category";
import { checkNameConflict } from "@/app/utils/helper";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: getSubCategoryParams) {
  try {
    const { id } = await params;

    const validation = idValidation(+id, SUB_CATEGORY_CONSTANTS.ID_VALIDATION);

    if (!validation.valid && validation.message) {
      return NextResponse.json(errorResponse(validation.message, HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const subCategory = await prisma.sub_category.findUnique({
      where: {
        id: +id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!subCategory || subCategory?.is_deleted) {
      return NextResponse.json(
        errorResponse(SUB_CATEGORY_CONSTANTS.NOT_EXISTS_OR_DELETED, HttpStatus.NOT_FOUND),
        {
          status: HttpStatus.NOT_FOUND,
        }
      );
    }

    return NextResponse.json(successResponse(COMMON_CONSTANTS.SUCCESS, subCategory), {
      status: HttpStatus.OK,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      }
    );
  }
}

export async function PUT(req: Request, { params }: getSubCategoryParams) {
  try {
    const body: editCategoryPayload = await req.json();
    const { name, description, categoryId } = body;

    const { id } = await params;

    const validationId = idValidation(+id, SUB_CATEGORY_CONSTANTS.ID_VALIDATION);

    if (!validationId.valid && validationId.message) {
      return NextResponse.json(errorResponse(validationId.message, HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const validation = addEditSubCategoryValidation(body);

    if (!validation.valid && validation.message) {
      return NextResponse.json(errorResponse(validation.message, HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }
    const categoryExist = await prisma.category.findFirst({
      where: {
        id: categoryId,
      },
    });

    if (!categoryExist || categoryExist.is_deleted) {
      return NextResponse.json(
        errorResponse(CATEGORY_CONSTANTS.NOT_EXISTS_OR_DELETED, HttpStatus.BAD_REQUEST),
        {
          status: HttpStatus.BAD_REQUEST,
        }
      );
    }

    const subCategoryExist = await prisma.sub_category.findFirst({
      where: {
        id: +id,
      },
    });

    if (!subCategoryExist || subCategoryExist?.is_deleted) {
      return NextResponse.json(
        errorResponse(SUB_CATEGORY_CONSTANTS.NOT_EXISTS_OR_DELETED, HttpStatus.BAD_REQUEST),
        {
          status: HttpStatus.BAD_REQUEST,
        }
      );
    }

    const nameExist = await checkNameConflict(name, "sub_category", {
      category_id: categoryId,
      excludeId: subCategoryExist.id,
    });
    if (nameExist.hasSameName && nameExist.message) {
      return NextResponse.json(errorResponse(nameExist.message, HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const updatedSubCategory = await prisma.sub_category.update({
      where: {
        id: +id,
      },
      data: {
        name: name.trim(),
        description: description,
        category_id: categoryId,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(
      successResponse(SUB_CATEGORY_CONSTANTS.UPDATE_SUCCESS, updatedSubCategory),
      {
        status: HttpStatus.OK,
      }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      }
    );
  }
}

export async function DELETE(req: Request, { params }: getCategoryParams) {
  try {
    const { id } = await params;

    const validation = idValidation(+id, SUB_CATEGORY_CONSTANTS.ID_VALIDATION);
    if (!validation.valid && validation.message) {
      return NextResponse.json(errorResponse(validation.message, HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const subCategory = await prisma.sub_category.findUnique({
      where: {
        id: +id,
      },
    });

    if (!subCategory) {
      return NextResponse.json(
        errorResponse(SUB_CATEGORY_CONSTANTS.NOT_EXISTS, HttpStatus.NOT_FOUND),
        {
          status: HttpStatus.NOT_FOUND,
        }
      );
    }

    const [subCategoryType, products] = await Promise.all([
      prisma.sub_category_type.findFirst({
        where: {
          sub_category: {
            id: +id,
            is_deleted: false,
          },
          is_deleted: false,
        },
        select: { id: true },
      }),
      prisma.products.findFirst({
        where: {
          sub_category_type: {
            sub_category: {
              id: +id,
              is_deleted: false,
            },
            is_deleted: false,
          },
          is_deleted: false,
        },
        select: { id: true },
      }),
    ]);

    if (subCategoryType || products) {
      return NextResponse.json(
        errorResponse(SUB_CATEGORY_CONSTANTS.IN_USED, HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    await prisma.sub_category.update({
      where: {
        id: +id,
      },
      data: {
        is_deleted: true,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(successResponse(SUB_CATEGORY_CONSTANTS.DELETE_SUCCESS), {
      status: 200,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      }
    );
  }
}
