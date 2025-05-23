import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const [subCategoriesType, adminSettingsCategory] = await Promise.all([
      prisma.shop_by_category.findMany({
        include: {
          sub_category: true,
        },
      }),
      prisma.admin_settings_category.findFirst(),
    ]);
    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, {
        subCategoriesType,
        adminSettingsCategory,
      }),
      {
        status: HttpStatus.OK,
      }
    );
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
