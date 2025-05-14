import { NextRequest, NextResponse } from "next/server";
import { cartService } from "@/app/services/cart.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { validateRequest } from "@/app/middleware/validateRequest";
import { removeFromCartSchema } from "@/app/utils/validationSchema/cart.validation";
export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      errorResponse("Unauthorized", HttpStatus.UNAUTHORIZED),
      { status: HttpStatus.UNAUTHORIZED }
    );
  }

  try {
    const validation = await validateRequest(removeFromCartSchema)(request);
    if ('status' in validation) {
      return validation;
    }

    await cartService.removeFromCart(
      Number(userId),
      validation.validatedData.product_ids
    );

    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, { 
        message: "Selected items removed from cart" 
      }),
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Clear cart error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", 
        error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR),
      { status: error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}