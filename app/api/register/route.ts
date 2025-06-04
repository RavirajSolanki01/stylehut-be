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

    const otp = generateOTP();

    const existingUser = await prisma.users.findUnique({ where: { email } });

    if (existingUser) {
      const now = new Date();

      if (
        existingUser.resend_otp_limit_expires_at &&
        new Date(existingUser.resend_otp_limit_expires_at) > now
      ) {
        const msRemaining = existingUser.resend_otp_limit_expires_at.getTime() - now.getTime();
        const minutesLeft = Math.floor(msRemaining / 60000);
        const secondsLeft = Math.floor((msRemaining % 60000) / 1000);
        return NextResponse.json(
          {
            message: `Maximum resend attempts reached. Please wait ${minutesLeft} minutes and ${secondsLeft} seconds before requesting a new OTP.`,
            data: {
              resend_opt_limit: existingUser.resend_otp_limit_expires_at,
            },
          },
          { status: 429 }
        );
      }
      if (
        existingUser.resend_otp_limit_expires_at &&
        new Date(existingUser.resend_otp_limit_expires_at) <= now
      ) {
        await prisma.users.update({
          where: { email },
          data: {
            resend_otp_attempts: 0,
            resend_otp_limit_expires_at: null,
            updated_at: now,
          },
        });
      }

      // After reset or no expiry, check for attempts
      const updatedUser = await prisma.users.findUnique({ where: { email } });

      if (updatedUser?.resend_otp_attempts === 3) {
        const attemptLimit = new Date(now.getTime() + 10 * 60 * 1000);

        await prisma.users.update({
          where: { email },
          data: {
            resend_otp_attempts: 0,
            resend_otp_limit_expires_at: attemptLimit,
            updated_at: now,
          },
        });

        const msRemaining = attemptLimit.getTime() - now.getTime();
        const minutesLeft = Math.floor(msRemaining / 60000);
        const secondsLeft = Math.floor((msRemaining % 60000) / 1000);
        return NextResponse.json(
          {
            message: `Maximum resend attempts reached. Please wait ${minutesLeft} minutes and ${secondsLeft} seconds before requesting a new OTP.`,
            data: {
              resend_opt_limit: attemptLimit,
            },
          },
          { status: 429 }
        );
      }

      // Allow sending OTP only for users with role_id === 1
      if (updatedUser?.role_id === 1) {
        await prisma.users.update({
          where: { email },
          data: {
            otp,
            updated_at: now,
            resend_otp_attempts: { increment: 1 },
          },
        });
      } else {
        return NextResponse.json({ message: "Email already exists" }, { status: 409 });
      }
    } else {
      // Create new user
      await prisma.users.create({
        data: {
          email,
          otp,
          role_id: 1,
          otp_verified: false,
          create_at: new Date(),
          updated_at: new Date(),
          is_deleted: false,
          resend_otp_attempts: 0,
          resend_otp_limit_expires_at: null,
        },
      });
    }

    await sendOTPEmail(email, otp);

    return NextResponse.json({ message: "OTP sent to email." }, { status: 200 });
  } catch (error) {
    console.error("OTP Request error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
