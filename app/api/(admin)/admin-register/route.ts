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
    let isNewUser = false;

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
      include: { role: true },
    });

    if (existingUser) {
      if (existingUser.role && existingUser.role.name.toLocaleLowerCase().includes("admin")) {
        // Update OTP for existing user
        await prisma.users.update({
          where: { email },
          data: { otp, updated_at: new Date() },
        });
      } else {
        return NextResponse.json(
          { message: "Email already exists with another role. Please contact support." },
          { status: 409 }
        );
      }
      if (existingUser.otp_limit_expires_at && existingUser.otp_limit_expires_at > new Date()) {
        return NextResponse.json(
          {
            message:
              "You've reached the maximum number of OTP verification attempts. Please try again after 1 minute.",
          },
          { status: 404 }
        );
      }
      if (existingUser.resend_otp_limit_expires_at && existingUser.resend_otp_limit_expires_at) {
        return NextResponse.json(
          {
            message:
              "Maximum resend attempts reached. Please wait 10 minutes before requesting a new OTP.",
          },
          { status: 404 }
        );
      }
    } else {
      // Create a new user with only email & OTP
      const admin_role = await prisma.role.findFirst({
        where: {
          name: {
            equals: "admin",
            mode: "insensitive",
          },
        },
      });

      if (admin_role) {
        await prisma.users.create({
          data: {
            email,
            otp,
            role_id: admin_role.id,
            otp_verified: false,
            resend_otp_attempts: 0,
            create_at: new Date(),
            updated_at: new Date(),
            is_deleted: false,
          },
        });
      } else {
        return NextResponse.json(
          {
            message: "Admin role not found. Account creation failed.",
          },
          { status: 404 }
        );
      }
    }

    // Send OTP via email
    await sendOTPEmail(email, otp);

    return NextResponse.json({ message: "OTP sent to email." }, { status: 200 });
  } catch (error) {
    console.error("OTP Request error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
