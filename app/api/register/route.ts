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

    // Generate OTP
    const otp = generateOTP();

    // Check if user exists
    const existingUser = await prisma.users.findUnique({ where: { email } });

    if (existingUser) {
      if (existingUser.resend_otp_limit_expires_at && existingUser.resend_otp_limit_expires_at) {
        return NextResponse.json(
          {
            message:
              "Maximum resend attempts reached. Please wait 10 minutes before requesting a new OTP.",
            data: {
              resend_opt_limit: existingUser.resend_otp_limit_expires_at,
            },
          },
          { status: 404 }
        );
      }
      if (existingUser.resend_otp_attempts && existingUser.resend_otp_attempts === 3) {
        const attemptLimit = new Date(Date.now() + 10 * 60 * 1000);
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
      if (existingUser.role_id == 1) {
        // Update OTP for existing user
        await prisma.users.update({
          where: { email },
          data: { otp, updated_at: new Date(), resend_otp_attempts: { increment: 1 } },
        });
      } else {
        return NextResponse.json({ message: "Email already exists" }, { status: 409 });
      }
    } else {
      // Create a new user with only email & OTP
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

    // Send OTP via email
    await sendOTPEmail(email, otp);

    return NextResponse.json({ message: "OTP sent to email." }, { status: 200 });
  } catch (error) {
    console.error("OTP Request error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const users = await prisma.users.findMany();
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
