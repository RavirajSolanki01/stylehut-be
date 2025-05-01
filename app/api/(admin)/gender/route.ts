import { NextRequest, NextResponse } from "next/server";
import { genderService } from "@/app/services/gender.service";
import { createGenderSchema } from "@/app/utils/validationSchema/gender.validation";
import { validateRequest } from "@/app/middleware/validateRequest";
import { errorResponse, paginatedResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { checkAdminRole } from "@/app/middleware/adminAuth";

export async function POST(request: NextRequest) {
  // Check admin authorization
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  const validation = await validateRequest(createGenderSchema)(request);
  if ('status' in validation) {
    return validation;
  }

  try {
    const gender = await genderService.createGender(validation.validatedData);
    return NextResponse.json(
      { message: COMMON_CONSTANTS.SUCCESS, data: gender },
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        errorResponse("Gender already exists", HttpStatus.CONFLICT),
        { status: HttpStatus.CONFLICT }
      );
    }
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "create_at";
    const order = (searchParams.get("order") as "asc" | "desc") || "desc";

    const skip = (page - 1) * pageSize;
    const { data, total } = await genderService.getAllGenders(
      skip,
      pageSize,
      search,
      sortBy,
      order
    );

    return NextResponse.json(
      paginatedResponse(COMMON_CONSTANTS.SUCCESS, data, page, pageSize, total),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}