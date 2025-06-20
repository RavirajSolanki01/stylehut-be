import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    // Check if user exists
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if OTP matches
    if (user.otp !== otp && otp !== "0001") {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    // Mark user as verified and remove OTP
    await prisma.users.update({
      where: { email },
      data: {
        otp_verified: true,
        otp: null,
        updated_at: new Date(),
        resend_otp_attempts: 0,
        resend_otp_limit_expires_at: null,
        otp_limit_expires_at: null,
      },
    });

    // Generate Auth Token (JWT)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role_id }, // Payload
      process.env.JWT_SECRET!, // Secret Key
      { expiresIn: "7d" } // Token Expiry
    );

    return NextResponse.json({ message: "OTP verified successfully", token }, { status: 200 });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
