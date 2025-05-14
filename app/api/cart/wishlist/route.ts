import { NextRequest, NextResponse } from "next/server";
import { cartService } from "@/app/services/cart.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { addWishlistToCartSchema } from "@/app/utils/validationSchema/cart.validation";
import { validateRequest } from "@/app/middleware/validateRequest";

// Add all wishlisted items to cart
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      errorResponse("Unauthorized", HttpStatus.UNAUTHORIZED),
      { status: HttpStatus.UNAUTHORIZED }
    );
  }

  try {
    const validation = await validateRequest(addWishlistToCartSchema)(request);
    if ('status' in validation) {
      return validation;
    }

    const cart = await cartService.addWishlistItemsToCart(
      Number(userId),
      validation.validatedData.product_ids
    );

    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, cart),
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Add wishlist to cart error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", 
        error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR),
      { status: error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

// Move cart items to wishlist
export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      errorResponse("Unauthorized", HttpStatus.UNAUTHORIZED),
      { status: HttpStatus.UNAUTHORIZED }
    );
  }

  try {

    const validation = await validateRequest(addWishlistToCartSchema)(request);
    if ('status' in validation) {
      return validation;
    }

    await cartService.moveCartItemsToWishlist(
      Number(userId),
      validation.validatedData.product_ids
    );

    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, { message: "All cart items moved to wishlist" }),
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Move cart to wishlist error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", 
        error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR),
      { status: error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}