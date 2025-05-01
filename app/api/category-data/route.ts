import { NextRequest, NextResponse } from "next/server";
import { categoryService } from "@/app/services/category.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";

export async function GET(request: NextRequest) {
  try {
    const data = await categoryService.getAllCategoryData();
    
    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, data),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("Get category data error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}