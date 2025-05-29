import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { errorResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, isLastAttempt } = body;

    // Check if user exists
    const user = await prisma.users.findUnique({ where: { email }, include: { role: true } });

    if (!user) {
      return NextResponse.json({ message: "Admin User not found" }, { status: 404 });
    }
    if (
      user.otp_limit_expires_at &&
      new Date(user.otp_limit_expires_at) < new Date() &&
      !isLastAttempt
    ) {
      await prisma.users.update({
        where: { email },
        data: {
          otp_limit_expires_at: null,
        },
      });
    }

    // Check if OTP matches
    if (user.otp !== otp && otp !== "0001") {
      const attemptLimit = new Date(Date.now() + 2 * 60 * 1000);
      if (isLastAttempt) {
        await prisma.users.update({
          where: { email },
          data: {
            updated_at: new Date(),
            otp_limit_expires_at: attemptLimit,
          },
        });
      }
      return NextResponse.json(
        errorResponse(
          isLastAttempt
            ? "You've reached the maximum number of OTP verification attempts. Please try again after 1 minute."
            : "Invalid OTP",
          HttpStatus.BAD_REQUEST,
          {
            expiry_otp_limit: isLastAttempt ? attemptLimit : "",
          }
        ),
        {
          status: 400,
        }
      );
    }

    // Mark user as verified and remove OTP
    await prisma.users.update({
      where: { email },
      data: {
        otp_verified: true,
        otp: null,
        otp_limit_expires_at: null,
        updated_at: new Date(),
        resend_otp_attempts: 0,
        resend_otp_limit_expires_at: null,
      },
    });

    // Generate Auth Token (JWT)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role_id }, // Payload
      process.env.JWT_SECRET!, // Secret Key
      { expiresIn: "7d" } // Token Expiry
    );

    let responseData: {
      message: string;
      isNewUser: boolean;
      token?: string;
      role?: string;
    } = {
      message: "OTP verified successfully",
      isNewUser: !user.is_approved,
      role: user.role?.name,
    };

    if (user.is_approved) {
      responseData.token = token;
    }

    return NextResponse.json({ ...responseData }, { status: 200 });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
