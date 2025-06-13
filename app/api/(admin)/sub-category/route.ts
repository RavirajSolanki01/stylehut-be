import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";
import { editCategoryPayload } from "@/app/types/sub-category";
import { errorResponse, successResponse, paginatedResponse } from "@/app/utils/apiResponse";
import {
  CATEGORY_CONSTANTS,
  SUB_CATEGORY_CONSTANTS,
  COMMON_CONSTANTS,
} from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { idValidation } from "@/app/utils/validationSchema/common";
import { addEditSubCategoryValidation } from "@/app/utils/validationSchema/sub-category";
import { checkNameConflict } from "@/app/utils/helper";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body: editCategoryPayload = await req.json();
    const { name, description, categoryId } = body;

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

    const nameExist = await checkNameConflict(name, "sub_category", {
      category_id: categoryId,
    });
    if (nameExist.hasSameName && nameExist.message) {
      return NextResponse.json(errorResponse(nameExist.message, HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const subCategory = await prisma.sub_category.create({
      data: {
        name: name.trim(),
        description: description,
        category_id: categoryId,
        create_at: new Date(),
        updated_at: new Date(),
        is_deleted: false,
      },
    });

    return NextResponse.json(successResponse(SUB_CATEGORY_CONSTANTS.CREATE_SUCCESS, subCategory), {
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "create_at";
    const order = (searchParams.get("order") as "asc" | "desc") || "desc";
    const categoryId = searchParams.get("categoryId");

    const skip = (page - 1) * pageSize;

    const orderBy = sortBy === "category" ? { category: { name: order } } : { [sortBy]: order };

    const baseFilter = {
      name: {
        contains: search,
        mode: "insensitive" as const,
      },
    };

    const where: Prisma.sub_categoryWhereInput = {
      is_deleted: false,
      OR: [
        baseFilter,
        {
          description: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
        {
          category: {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        },
      ],
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

    const [data, total] = await Promise.all([
      prisma.sub_category.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.sub_category.count({ where }),
    ]);

    return NextResponse.json(
      paginatedResponse(COMMON_CONSTANTS.SUCCESS, data, page, pageSize, total),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("GET subcategories error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
