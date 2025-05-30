import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";
import { errorResponse, successResponse, paginatedResponse } from "@/app/utils/apiResponse";
import {
  CATEGORY_CONSTANTS,
  SUB_CATEGORY_CONSTANTS,
  SUB_CATEGORY_TYPE_CONSTANTS,
  COMMON_CONSTANTS,
} from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { idValidation } from "@/app/utils/validationSchema/common";
import { addEditSubCategoryTypeValidation } from "@/app/utils/validationSchema/sub-category-type";
import { addSubCategoryTypePayload } from "@/app/types/sub-category-type";
import { checkNameConflict } from "@/app/utils/helper";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body: addSubCategoryTypePayload = await req.json();
    const { name, description, subCategoryId } = body;

    const validation = addEditSubCategoryTypeValidation(body);

    if (!validation.valid && validation.message) {
      return NextResponse.json(errorResponse(validation.message, HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
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

    const nameExist = await checkNameConflict(name, "sub_category_type", {
      sub_category_id: subCategoryId,
    });
    if (nameExist.hasSameName && nameExist.message) {
      return NextResponse.json(errorResponse(nameExist.message, HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const subCategoryType = await prisma.sub_category_type.create({
      data: {
        name: name.trim(),
        description: description,
        sub_category_id: subCategoryId,
        create_at: new Date(),
        updated_at: new Date(),
        is_deleted: false,
      },
    });

    return NextResponse.json(
      successResponse(SUB_CATEGORY_TYPE_CONSTANTS.CREATE_SUCCESS, subCategoryType),
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "create_at";
    const order = (searchParams.get("order") as "asc" | "desc") || "desc";
    const categoryId = searchParams.get("categoryId");
    const subCategoryId = searchParams.get("subCategoryId");

    const skip = (page - 1) * pageSize;

    let orderBy;

    switch (sortBy) {
      // case "category":
      //   orderBy = { category: { name: order } };
      //   break;
      case "sub_category":
        orderBy = { sub_category: { name: order } };
        break;
      default:
        orderBy = { [sortBy]: order };
        break;
    }

    const baseFilter = {
      name: {
        contains: search,
        mode: "insensitive" as const,
      },
    };

    const where: Prisma.sub_category_typeWhereInput = {
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
          sub_category: {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
            category: {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
        },
      ],
    };

    if (subCategoryId) {
      const subCategoryIdValidation = idValidation(
        +subCategoryId,
        SUB_CATEGORY_CONSTANTS.ID_VALIDATION
      );
      if (!subCategoryIdValidation.valid && subCategoryIdValidation.message) {
        return NextResponse.json(
          errorResponse(subCategoryIdValidation.message, HttpStatus.BAD_REQUEST),
          { status: HttpStatus.BAD_REQUEST }
        );
      }
      const subCategory = await prisma.sub_category.findFirst({
        where: {
          id: +subCategoryId,
        },
      });
      if (!subCategory || subCategory.is_deleted) {
        return NextResponse.json(
          errorResponse(SUB_CATEGORY_CONSTANTS.NOT_EXISTS_OR_DELETED, HttpStatus.NOT_FOUND),
          { status: HttpStatus.NOT_FOUND }
        );
      }

      if (categoryId && subCategory.category_id !== +categoryId) {
        return NextResponse.json(
          errorResponse(
            SUB_CATEGORY_TYPE_CONSTANTS.SUB_CATEGORY_NOT_ASSOCIATED_WITH_CATEGORY,
            HttpStatus.BAD_REQUEST
          ),
          { status: HttpStatus.BAD_REQUEST }
        );
      }

      where.sub_category_id = +subCategoryId;
    }

    const [data, total] = await Promise.all([
      prisma.sub_category_type.findMany({
        where,
        include: {
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
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.sub_category_type.count({ where }),
    ]);

    return NextResponse.json(
      paginatedResponse(COMMON_CONSTANTS.SUCCESS, data, page, pageSize, total),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
