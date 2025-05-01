import { NextRequest, NextResponse } from "next/server";
import { cartService } from "@/app/services/cart.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { validateRequest } from "@/app/middleware/validateRequest";
import { updateCartSchema } from "@/app/utils/validationSchema/cart.validation";

type Props = {
  params: Promise<{ itemId: string }>;
};

export async function PUT(request: NextRequest, { params }: Props) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      errorResponse("Unauthorized", HttpStatus.UNAUTHORIZED),
      { status: HttpStatus.UNAUTHORIZED }
    );
  }

  try {
    const { itemId } = await params;
    const validation = await validateRequest(updateCartSchema)(request);
    if ('status' in validation) {
      return validation;
    }

    const cartItem = await cartService.updateCartItem(
      Number(userId),
      Number(itemId),
      validation.validatedData
    );

    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, cartItem),
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Update cart item error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", 
        error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR),
      { status: error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      errorResponse("Unauthorized", HttpStatus.UNAUTHORIZED),
      { status: HttpStatus.UNAUTHORIZED }
    );
  }

  try {
    const { itemId } = await params;
    await cartService.removeFromCart(Number(userId), Number(itemId));

    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS),
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Remove from cart error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", 
        error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR),
      { status: error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}