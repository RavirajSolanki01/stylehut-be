import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendOTPEmail } from "@/app/services/mail.service";

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

    await prisma.users.update({
      where: { email },
      data: { otp, updated_at: new Date(), otp_verified: false },
    });

    const isOtpSent = await sendOTPEmail(email, otp);
    if (!isOtpSent) {
      return NextResponse.json({ message: "Failed to send OTP" }, { status: 500 });
    }

    return NextResponse.json({ message: "OTP sent to email." }, { status: 200 });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
