import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const subCategoryTypes = await prisma.brand.findMany({
      where: {
        is_deleted: false,
      },
      orderBy: {
        name: "asc",
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
