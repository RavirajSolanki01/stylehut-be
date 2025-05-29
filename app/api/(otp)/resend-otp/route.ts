import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendOTPEmail } from "@/app/services/mail.service";
import { successResponse } from "@/app/utils/apiResponse";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { generateOTP } from "@/app/utils/common";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;
    const otp = generateOTP();
    // Check if user exists
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.resend_otp_attempts && user.resend_otp_attempts === 3) {
      const attemptLimit = new Date(Date.now() + 2 * 60 * 1000);
      await prisma.users.update({
        where: { email },
        data: {
          resend_otp_attempts: 0,
          resend_otp_limit_expires_at: attemptLimit,
          updated_at: new Date(),
        },
      });
      return NextResponse.json(
        {
          message:
            "Maximum resend attempts reached. Please wait 10 minutes before requesting a new OTP.",
          data: {
            resend_opt_limit: attemptLimit,
          },
        },
        { status: 404 }
      );
    }

    await prisma.users.update({
      where: { email },
      data: {
        otp,
        updated_at: new Date(),
        otp_verified: false,
        resend_otp_attempts: { increment: 1 },
        resend_otp_limit_expires_at: null,
      },
    });

    // const isOtpSent = await sendOTPEmail(email, otp);
    // if (!isOtpSent) {
    //   return NextResponse.json({ message: "Failed to send OTP" }, { status: 500 });
    // }

    return NextResponse.json({ message: "OTP sent to email." }, { status: 200 });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

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
        resend_otp_limit_expires_at: user.resend_otp_limit_expires_at,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP Verification Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
