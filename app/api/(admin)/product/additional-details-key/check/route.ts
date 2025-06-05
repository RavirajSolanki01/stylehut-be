import { NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { checkAdminRole } from "@/app/middleware/adminAuth";
import { productService } from "@/app/services/product.service";

export async function GET(request: NextRequest) {
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    if (!name) {
      return NextResponse.json(
        errorResponse('Name parameter is required', HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }
    const isPresent = await productService.checkProductAdditionalKeyPresent(name);
    if (isPresent) {
      return NextResponse.json(errorResponse("Use different name", HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    return NextResponse.json(successResponse("Name is available", {}), {
      status: HttpStatus.OK,
    });
  } catch (error) {
    console.error("Create additional details key error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
