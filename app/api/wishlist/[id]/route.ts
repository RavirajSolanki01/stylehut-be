import { NextRequest, NextResponse } from "next/server";
import { wishlistService } from "@/app/services/wishlist.service";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { errorResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Props) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      errorResponse("Unauthorized", HttpStatus.UNAUTHORIZED),
      { status: HttpStatus.UNAUTHORIZED }
    );
  }

  try {
    const { id } = await params;
    const brand = await wishlistService.checkWishlist(Number(userId), Number(id));
    if (!brand) {
      return NextResponse.json({ error: "Wishlist item not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: COMMON_CONSTANTS.SUCCESS, data: brand },
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error(error);
    // Handle any errors that occur during the process
    if (error instanceof Error) {
      return NextResponse.json(
        errorResponse(error.message, HttpStatus.INTERNAL_SERVER_ERROR),
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      );
    }
    // If the error is not an instance of Error, return a generic error message

    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}