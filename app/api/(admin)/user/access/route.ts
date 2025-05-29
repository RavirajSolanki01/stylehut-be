import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/app/services/user.service";
import { successResponse, errorResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { verifyAuth } from "@/app/utils/auth";
import { sendUserActivationStausEmail } from "@/app/services/mail.service";
import { PrismaClient } from "@prisma/client";

type Props = {
  params: Promise<{ id: string }>;
};

const prisma = new PrismaClient();

export async function PUT(request: NextRequest, { params }: Props) {
  const authResult = await verifyAuth(request);

  const { userId, ActiveStatus } = await request.json();

  if (!authResult.authorized || authResult.user?.role?.name !== "SuperAdmin") {
    return NextResponse.json(errorResponse("Unauthorized access", HttpStatus.UNAUTHORIZED), {
      status: HttpStatus.UNAUTHORIZED,
    });
  }

  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  try {
    if (!userId) {
      return NextResponse.json(errorResponse("User ID is required", HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    if (!(await userService.exists(Number(userId)))) {
      return NextResponse.json(
        errorResponse("User not found or deleted", HttpStatus.UNAUTHORIZED),
        { status: HttpStatus.UNAUTHORIZED }
      );
    }
    const updateUserStatus = await userService.updateUserStatus(Number(userId), ActiveStatus);

    const message = ActiveStatus
      ? "Admin user activated successfully."
      : "Admin user deactivated successfully.";
    await sendUserActivationStausEmail((user && user.email) || "", message);

    return NextResponse.json(successResponse(message, updateUserStatus), { status: HttpStatus.OK });
  } catch (error: any) {
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
