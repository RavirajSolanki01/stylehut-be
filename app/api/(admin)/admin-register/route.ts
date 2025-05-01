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
      if (existingUser.role_id == 3) {
        // Update OTP for existing user
        await prisma.users.update({
          where: { email },
          data: { otp, updated_at: new Date() },
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
          role_id: 3,
          otp_verified: false,
          create_at: new Date(),
          updated_at: new Date(),
          is_deleted: false,
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
