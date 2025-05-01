import { NextRequest, NextResponse } from "next/server";
import { cartService } from "@/app/services/cart.service";
import { errorResponse, successResponse, paginatedResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { validateRequest } from "@/app/middleware/validateRequest";
import { addToCartSchema, cartQuerySchema } from "@/app/utils/validationSchema/cart.validation";
import { checkAdminRole } from "@/app/middleware/adminAuth";

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      errorResponse("Unauthorized", HttpStatus.UNAUTHORIZED),
      { status: HttpStatus.UNAUTHORIZED }
    );
  }

  try {
    const validation = await validateRequest(addToCartSchema)(request);
    if ('status' in validation) {
      return validation;
    }

    const cartItem = await cartService.addToCart(
      Number(userId),
      validation.validatedData
    );

    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, cartItem),
      { status: HttpStatus.OK }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Add to cart error:", error);
      return NextResponse.json(
        errorResponse(error.message || "Internal Server Error", 
          error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR),
        { status: error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR }
      );
    }
  
    // Handle the case where the error is not an instance of Error (e.g., primitive values)
    console.error("An unknown error occurred:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
  
}

export async function GET(request: NextRequest) {
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const { searchParams } = new URL(request.url);
    const validatedQuery = await cartQuerySchema.parseAsync({
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "10",
      search: searchParams.get("search") || "",
      sortBy: searchParams.get("sortBy") || "created_at",
      order: searchParams.get("order") || "desc",
    });

    const { data, total } = await cartService.getAllCartsForAdmin(validatedQuery);

    return NextResponse.json(
      paginatedResponse(
        COMMON_CONSTANTS.SUCCESS,
        data,
        validatedQuery.page,
        validatedQuery.pageSize,
        total
      ),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("Get all carts error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}