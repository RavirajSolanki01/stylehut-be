import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { CATEGORY_CONSTANTS, COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { categoryIdSchema, createCategorySchema } from "@/app/utils/validationSchema/category";
import { getCategoryParams } from "@/app/types/category";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { checkNameConflict } from "@/app/utils/helper";
import { validateRequest } from "@/app/middleware/validateRequest";
import { categoryService } from "@/app/services/category.service";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: getCategoryParams) {
  try {
    const { id } = await params;
    const validatedId = categoryIdSchema.safeParse(+id);

    if (!validatedId.success) {
      return NextResponse.json(
        errorResponse(COMMON_CONSTANTS.ID_REQUIRED, HttpStatus.BAD_REQUEST),
        {
          status: HttpStatus.BAD_REQUEST,
        }
      );
    }

    const category = await prisma.category.findUnique({
      where: {
        id: +id,
      },
    });

    if (!category || category?.is_deleted) {
      return NextResponse.json(
        errorResponse(CATEGORY_CONSTANTS.NOT_EXISTS_OR_DELETED, HttpStatus.NOT_FOUND),
        {
          status: HttpStatus.NOT_FOUND,
        }
      );
    }

    return NextResponse.json(successResponse(COMMON_CONSTANTS.SUCCESS, category), {
      status: HttpStatus.OK,
    });
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

export async function DELETE(req: Request, { params }: getCategoryParams) {
  try {
    const id = Number((await params).id);

    const validatedId = categoryIdSchema.safeParse(id);

    if (!validatedId.success) {
      return NextResponse.json(
        errorResponse(COMMON_CONSTANTS.ID_REQUIRED, HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id, is_deleted: false },
    });

    if (!category) {
      return NextResponse.json(errorResponse(CATEGORY_CONSTANTS.NOT_EXISTS, HttpStatus.NOT_FOUND), {
        status: HttpStatus.NOT_FOUND,
      });
    }
    const [subCategories, subCategoryType, products] = await Promise.all([
      prisma.sub_category.findFirst({
        where: {
          category_id: id,
          is_deleted: false,
        },
        select: { id: true },
      }),
      prisma.sub_category_type.findFirst({
        where: {
          sub_category: {
            category_id: id,
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
              category_id: id,
              is_deleted: false,
            },
            is_deleted: false,
          },
          is_deleted: false,
        },
        select: { id: true },
      }),
    ]);

    if (subCategories || subCategoryType || products) {
      return NextResponse.json(errorResponse(CATEGORY_CONSTANTS.IN_USED, HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    await prisma.category.update({
      where: { id },
      data: {
        is_deleted: true,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(successResponse(CATEGORY_CONSTANTS.DELETE_SUCCESS), {
      status: HttpStatus.OK,
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(req: Request, { params }: getCategoryParams) {
  try {
    const id = Number((await params).id);

    const validatedId = categoryIdSchema.safeParse(id);

    if (!validatedId.success) {
      return NextResponse.json(
        errorResponse(COMMON_CONSTANTS.ID_REQUIRED, HttpStatus.BAD_REQUEST),
        {
          status: HttpStatus.BAD_REQUEST,
        }
      );
    }
    const validation = await validateRequest(createCategorySchema)(req);

    if ("status" in validation) {
      return validation;
    }

    const { validatedData: body } = validation;
    const { name, description } = body;

    const categoryExit = await prisma.category.findFirst({
      where: {
        id,
      },
    });

    if (!categoryExit || categoryExit.is_deleted) {
      return NextResponse.json(
        errorResponse(CATEGORY_CONSTANTS.NOT_EXISTS_OR_DELETED, HttpStatus.NOT_FOUND),
        {
          status: HttpStatus.NOT_FOUND,
        }
      );
    }

    const nameExist = await checkNameConflict(name, "category", { excludeId: categoryExit.id });
    if (nameExist.hasSameName && nameExist.message) {
      return NextResponse.json(errorResponse(nameExist.message, HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const updatedCategory = await prisma.category.update({
      where: {
        id: +id,
      },
      data: {
        name: name.trim(),
        description: description,
        updated_at: new Date(),
      },
    });
    return NextResponse.json(successResponse(CATEGORY_CONSTANTS.UPDATE_SUCCESS, updatedCategory), {
      status: HttpStatus.OK,
    });
  } catch (error) {
    console.error("Category update Error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      }
    );
  }
}
