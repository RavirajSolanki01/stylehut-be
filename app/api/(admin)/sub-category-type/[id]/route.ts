import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSubCategoryParams } from "@/app/types/sub-category";
import { addSubCategoryTypePayload } from "@/app/types/sub-category-type";
import { getCategoryParams } from "@/app/types/category";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import {
  SUB_CATEGORY_TYPE_CONSTANTS,
  COMMON_CONSTANTS,
  CATEGORY_CONSTANTS,
  SUB_CATEGORY_CONSTANTS,
} from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { idValidation } from "@/app/utils/validationSchema/common";
import { addEditSubCategoryTypeValidation } from "@/app/utils/validationSchema/sub-category-type";
import { checkNameConflict } from "@/app/utils/helper";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: getSubCategoryParams) {
  try {
    const { id } = await params;

    const validation = idValidation(+id, SUB_CATEGORY_TYPE_CONSTANTS.ID_VALIDATION);

    if (!validation.valid && validation.message) {
      return NextResponse.json(errorResponse(validation.message, HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const subCategoryType = await prisma.sub_category_type.findUnique({
      where: {
        id: +id,
      },
      include: {
        sub_category: {
          select: {
            id: true,
            name: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!subCategoryType || subCategoryType?.is_deleted) {
      return NextResponse.json(
        errorResponse(SUB_CATEGORY_TYPE_CONSTANTS.NOT_EXISTS_OR_DELETED, HttpStatus.NOT_FOUND),
        {
          status: HttpStatus.NOT_FOUND,
        }
      );
    }

    return NextResponse.json(successResponse(COMMON_CONSTANTS.SUCCESS, subCategoryType), {
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
    const body: addSubCategoryTypePayload = await req.json();
    const { name, description, categoryId, subCategoryId } = body;

    const { id } = await params;

    const validationId = idValidation(+id, SUB_CATEGORY_TYPE_CONSTANTS.ID_VALIDATION);

    if (!validationId.valid && validationId.message) {
      return NextResponse.json(errorResponse(validationId.message, HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const validation = addEditSubCategoryTypeValidation(body);

    if (!validation.valid && validation.message) {
      return NextResponse.json(errorResponse(validation.message, HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const subCategoryTypeExist = await prisma.sub_category_type.findFirst({
      where: {
        id: +id,
      },
    });

    if (!subCategoryTypeExist || subCategoryTypeExist.is_deleted) {
      return NextResponse.json(
        errorResponse(SUB_CATEGORY_TYPE_CONSTANTS.NOT_EXISTS_OR_DELETED, HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
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
        id: subCategoryId,
      },
    });

    if (!subCategoryExist || subCategoryExist.is_deleted) {
      return NextResponse.json(
        errorResponse(SUB_CATEGORY_CONSTANTS.NOT_EXISTS_OR_DELETED, HttpStatus.BAD_REQUEST),
        {
          status: HttpStatus.BAD_REQUEST,
        }
      );
    }

    if (categoryId && subCategoryExist.category_id !== +categoryId) {
      return NextResponse.json(
        errorResponse(
          SUB_CATEGORY_TYPE_CONSTANTS.SUB_CATEGORY_NOT_ASSOCIATED_WITH_CATEGORY,
          HttpStatus.BAD_REQUEST
        ),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const nameExist = await checkNameConflict(name, "sub_category_type", {
      category_id: categoryId,
      sub_category_id: subCategoryId,
      excludeId: subCategoryTypeExist.id,
    });
    if (nameExist.hasSameName && nameExist.message) {
      return NextResponse.json(errorResponse(nameExist.message, HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const updatedSubCategory = await prisma.sub_category_type.update({
      where: {
        id: +id,
      },
      data: {
        name: name.trim(),
        description: description,
        sub_category_id: subCategoryId,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(
      successResponse(SUB_CATEGORY_TYPE_CONSTANTS.UPDATE_SUCCESS, updatedSubCategory),
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

    const validation = idValidation(+id, SUB_CATEGORY_TYPE_CONSTANTS.ID_VALIDATION);
    if (!validation.valid && validation.message) {
      return NextResponse.json(errorResponse(validation.message, HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const subCategoryType = await prisma.sub_category_type.findUnique({
      where: {
        id: +id,
      },
    });

    if (!subCategoryType) {
      return NextResponse.json(
        errorResponse(SUB_CATEGORY_TYPE_CONSTANTS.NOT_EXISTS, HttpStatus.NOT_FOUND),
        {
          status: HttpStatus.NOT_FOUND,
        }
      );
    }

    const isUseInProduct = await prisma.products.findMany({
      where: {
        is_deleted: false,
      },
    });

    if (isUseInProduct.length > 0) {
      return NextResponse.json(
        errorResponse(SUB_CATEGORY_TYPE_CONSTANTS.IN_USED, HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    await prisma.sub_category_type.update({
      where: {
        id: +id,
      },
      data: {
        is_deleted: true,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(successResponse(SUB_CATEGORY_TYPE_CONSTANTS.DELETE_SUCCESS), {
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
