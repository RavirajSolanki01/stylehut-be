import { NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { userService } from "@/app/services/user.service";

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  
  if (!userId) {
    return NextResponse.json(
      errorResponse("User ID not provided", HttpStatus.BAD_REQUEST),
      { status: HttpStatus.BAD_REQUEST }
    );
  }

  try {
    const user = await userService.getUserById(Number(userId));

    if (!user) {
      return NextResponse.json(
        errorResponse("User not found", HttpStatus.NOT_FOUND),
        { status: HttpStatus.NOT_FOUND }
      );
    }

    return NextResponse.json(
      successResponse("User validated successfully", user),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}