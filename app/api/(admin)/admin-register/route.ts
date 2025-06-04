import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateOTP } from "@/app/utils/common";
import { sendOTPEmail } from "@/app/services/mail.service";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const now = new Date();
    const otp = generateOTP();

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
      include: { role: true },
    });

    if (existingUser) {
      if (!existingUser.role || !existingUser.role.name.toLowerCase().includes("admin")) {
        return NextResponse.json(
          {
            message: "Email already exists with another role. Please contact support.",
          },
          { status: 409 }
        );
      }

      // Check & reset resend_otp_attempts if 10 minutes have passed
      if (
        existingUser.resend_otp_limit_expires_at &&
        existingUser.resend_otp_limit_expires_at <= now
      ) {
        await prisma.users.update({
          where: { email },
          data: {
            resend_otp_attempts: 0,
            resend_otp_limit_expires_at: null,
            updated_at: now,
          },
        });
        existingUser.resend_otp_attempts = 0;
        existingUser.resend_otp_limit_expires_at = null;
      }

      // Check resend limit
      if (
        existingUser.resend_otp_limit_expires_at &&
        existingUser.resend_otp_limit_expires_at > now
      ) {
        const msRemaining = existingUser.resend_otp_limit_expires_at.getTime() - now.getTime();
        const minutesLeft = Math.floor(msRemaining / 60000);
        const secondsLeft = Math.floor((msRemaining % 60000) / 1000);
        return NextResponse.json(
          {
            message: `Maximum resend attempts reached. Please wait ${minutesLeft} minutes and ${secondsLeft} seconds before requesting a new OTP.`,
            timeLimit: existingUser.resend_otp_limit_expires_at,
          },
          { status: 429 }
        );
      }

      // Check OTP verification attempt block (1 minute)
      if (existingUser.otp_limit_expires_at && existingUser.otp_limit_expires_at > now) {
        return NextResponse.json(
          {
            message:
              "You've reached the maximum number of OTP verification attempts. Please try again after 1 minute.",
          },
          { status: 429 }
        );
      }

      const newResendAttempts = (existingUser.resend_otp_attempts ?? 0) + 1;

      const updateData: any = {
        otp,
        updated_at: now,
        resend_otp_attempts: newResendAttempts,
      };

      // If this was the 3rd attempt, block further resends for 10 minutes
      if (newResendAttempts >= 3) {
        updateData.resend_otp_attempts = 0;
        updateData.resend_otp_limit_expires_at = new Date(now.getTime() + 10 * 60 * 1000); // 10 mins
      }

      await prisma.users.update({
        where: { email },
        data: updateData,
      });
    } else {
      // New user — get admin role
      const adminRole = await prisma.role.findFirst({
        where: {
          name: {
            equals: "admin",
            mode: "insensitive",
          },
        },
      });

      if (!adminRole) {
        return NextResponse.json(
          { message: "Admin role not found. Account creation failed." },
          { status: 500 }
        );
      }

      await prisma.users.create({
        data: {
          email,
          otp,
          role_id: adminRole.id,
          otp_verified: false,
          resend_otp_attempts: 0,
          resend_otp_limit_expires_at: null,
          create_at: now,
          updated_at: now,
          is_deleted: false,
        },
      });
    }

    // Send OTP
    await sendOTPEmail(email, otp);

    return NextResponse.json({ message: "OTP sent to email." }, { status: 200 });
  } catch (error) {
    console.error("OTP Request error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
