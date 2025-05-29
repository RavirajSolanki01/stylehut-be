import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { successResponse } from "@/app/utils/apiResponse";
import { COMMON_CONSTANTS } from "@/app/utils/constants";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const email = searchParams.get("email");
    let user;

    // Check if user exists

    if (email) {
      user = await prisma.users.findUnique({ where: { email } });
    }
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, {
        otp_limit_expires_at: user.otp_limit_expires_at,
        message:
          user.otp_limit_expires_at === null || user.otp_limit_expires_at < new Date()
            ? ""
            : "You've reached the maximum number of OTP verification attempts. Please try again after 1 minute.",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP Verification Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
