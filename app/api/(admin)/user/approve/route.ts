import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { verifyAuth } from "@/app/utils/auth";

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    // Verify if the requester is a super admin
    const authResult = await verifyAuth(request);
    if (!authResult.authorized || authResult.user?.role?.name !== "SuperAdmin") {
      return NextResponse.json(
        errorResponse("Unauthorized access", HttpStatus.UNAUTHORIZED),
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        errorResponse("User ID is required", HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // Get the user and check if they are an admin
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json(
        errorResponse("User not found", HttpStatus.NOT_FOUND),
        { status: HttpStatus.NOT_FOUND }
      );
    }

    if (user.role?.name !== "Admin") {
      return NextResponse.json(
        errorResponse("User is not an admin", HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // Update user approval status
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: { is_approved: !user?.is_approved },
    });

    return NextResponse.json(
      successResponse( !user?.is_approved ? "Admin user activated successfully" : "Admin user deactivated successfully", updatedUser),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("Approve admin error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}