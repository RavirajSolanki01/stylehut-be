import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { successResponse, errorResponse } from "@/app/utils/apiResponse";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        is_deleted: false,
      },
    });

    return NextResponse.json(successResponse(COMMON_CONSTANTS.SUCCESS, categories), {
      status: HttpStatus.OK,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      }
    );
  }
}
