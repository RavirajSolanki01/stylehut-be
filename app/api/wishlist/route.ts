import { NextRequest, NextResponse } from "next/server";
import { wishlistService } from "@/app/services/wishlist.service";
import { userService } from "@/app/services/user.service";
import { createWishlistSchema, wishlistQuerySchema } from "@/app/utils/validationSchema/wishlist.validation";
import { validateRequest } from "@/app/middleware/validateRequest";
import { errorResponse, successResponse, paginatedResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { z } from "zod";

/**
 * Handles the POST request to toggle an item in the user's wishlist.
 *
 * This function validates the incoming request against the createWishlistSchema,
 * checks for user authorization, and then calls the wishlistService to toggle
 * the wishlist item. It returns a JSON response with the result of the operation.
 *
 * @param request - The incoming NextRequest object containing the request details.
 * @returns A NextResponse object with the result of the wishlist toggle operation.
 */
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      errorResponse("Unauthorized", HttpStatus.UNAUTHORIZED),
      { status: HttpStatus.UNAUTHORIZED }
    );
  }
  try {

    // Add user validation
    if (!(await userService.exists(Number(userId)))) {
      return NextResponse.json(
        errorResponse("User not found or deactivated", HttpStatus.UNAUTHORIZED),
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    const validation = await validateRequest(createWishlistSchema)(request);
    if ('status' in validation) {
      return validation;
    }

    const result = await wishlistService.toggleWishlist(
			Number(userId),
			validation.validatedData
    );
    
    return NextResponse.json(
      successResponse(
        result.message,
        {...result.data, isWishlisted: result.isWishlisted}
      ),
      { status: HttpStatus.OK }
    );
  } catch (error) {
  console.log("🚀 ~ POST ~ error:", error)

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				errorResponse(error.errors[0].message, HttpStatus.BAD_REQUEST, error.errors),
				{ status: HttpStatus.BAD_REQUEST }
			);
		}
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      errorResponse("Unauthorized", HttpStatus.UNAUTHORIZED),
      { status: HttpStatus.UNAUTHORIZED }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    
		const validatedQuery = await wishlistQuerySchema.parseAsync({
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
      sortBy: searchParams.get("sortBy") as any || "created_at",
      order: searchParams.get("order") as any || "desc",
			// search: searchParams.get("search") || "",
    });

    const { data, total } = await wishlistService.getWishlist(
      Number(userId), 
      validatedQuery
    );

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
    console.error("Get wishlist error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}