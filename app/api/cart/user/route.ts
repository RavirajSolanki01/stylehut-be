import { NextRequest, NextResponse } from "next/server";
import { cartService } from "@/app/services/cart.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";


export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      errorResponse("User ID not found!", HttpStatus.BAD_REQUEST),
      { status: HttpStatus.BAD_REQUEST }
    );
  }

  try {
    const cart = await cartService.getCart(Number(userId));

    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, cart),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}