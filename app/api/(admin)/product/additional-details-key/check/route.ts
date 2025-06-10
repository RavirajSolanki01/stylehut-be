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
    const name = searchParams.get("name");
    const id = searchParams.get("id");

    if (!name) {
      return NextResponse.json(
        successResponse("Name parameter is required", HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    let isPresent;

    if (id) {
      // If ID is provided, check for duplicate name excluding the current record
      isPresent = await productService.checkProductAdditionalKeyPresentWithId(name, +id);
    } else {
      // If no ID is provided, check if the name exists in the system
      isPresent = await productService.checkProductAdditionalKeyPresent(name);
    }

    if (isPresent) {
      return NextResponse.json(successResponse("Use different name", { available: false }), {
        status: HttpStatus.OK,
      });
    }

    return NextResponse.json(successResponse("Name is available", { available: true }), {
      status: HttpStatus.OK,
    });
  } catch (error) {
    console.error("Check additional details key error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
