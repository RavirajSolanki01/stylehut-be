import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/app/services/user.service";
import { successResponse, errorResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { verifyAuth } from "@/app/utils/auth";

type Props = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: Props) {
    const authResult = await verifyAuth(request);
    if (!authResult.authorized || authResult.user?.role?.name !== "SuperAdmin") {
    return NextResponse.json(
        errorResponse("Unauthorized access", HttpStatus.UNAUTHORIZED),
        { status: HttpStatus.UNAUTHORIZED }
    );
    }

  try {
		const { userId, ActiveStatus } = await request.json();
    if (!userId) {
      return NextResponse.json(
        errorResponse("User ID is required", HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

		if (!(await userService.exists(Number(userId)))) {
      return NextResponse.json(
        errorResponse("User not found or deleted", HttpStatus.UNAUTHORIZED),
        { status: HttpStatus.UNAUTHORIZED }
      );
    }
		const updateUserStatus = await userService.updateUserStatus(Number(userId), ActiveStatus);

		return NextResponse.json(
			successResponse( !updateUserStatus?.is_active ? "Admin user activated successfully" : "Admin user deactivated successfully", updateUserStatus),
			{ status: HttpStatus.OK }
		);

  } catch (error: any) {

    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}