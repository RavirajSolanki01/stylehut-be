import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createCategorySchema } from "@/app/utils/validationSchema/category";
import { errorResponse, successResponse, paginatedResponse } from "@/app/utils/apiResponse";
import { CATEGORY_CONSTANTS, COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { checkNameConflict } from "@/app/utils/helper";
import { validateRequest } from "@/app/middleware/validateRequest";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const validation = await validateRequest(createCategorySchema)(req);

    if ("status" in validation) {
      return validation;
    }

    const { validatedData: body } = validation;

    const { name, description } = body;

    const nameExist = await checkNameConflict(name, "category");
    if (nameExist.hasSameName && nameExist.message) {
      return NextResponse.json(errorResponse(nameExist.message, HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description,
        create_at: new Date(),
        updated_at: new Date(),
        is_deleted: false,
      },
    });

    return NextResponse.json(successResponse(CATEGORY_CONSTANTS.CREATE_SUCCESS, category), {
      status: HttpStatus.OK,
    });
  } catch (error) {
    console.error("Category create Error:", error);
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
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");
    const searchParam = searchParams.get("search");
    const sortByParam = searchParams.get("sortBy");
    const orderParam = searchParams.get("order");

    const page = parseInt(pageParam ? pageParam : "1") || 1;
    const pageSize = parseInt(pageSizeParam ? pageSizeParam : "10") || 10;
    const search = searchParam || "";
    const sortBy = sortByParam || "name";
    const order = (orderParam as "asc" | "desc") || "desc";

    const skip = (page - 1) * pageSize;

    const where = {
      is_deleted: false,
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
      ],
    };

    const [data, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: {
          [sortBy]: order,
        },
        skip,
        take: pageSize,
      }),
      prisma.category.count({ where }),
    ]);

    return NextResponse.json(
      paginatedResponse(COMMON_CONSTANTS.SUCCESS, data, page, pageSize, total),
      {
        status: HttpStatus.OK,
      }
    );
  } catch (error) {
    console.error("Get list category error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      }
    );
  }
}
