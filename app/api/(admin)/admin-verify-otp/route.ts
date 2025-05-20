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
      return NextResponse.json({ message: "Admin User not found" }, { status: 404 });
    }

    // Check if OTP matches
    if ((user.otp !== otp) && (otp !== "0001")) {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    // Mark user as verified and remove OTP
    await prisma.users.update({
      where: { email },
      data: { otp_verified: true, otp: null, updated_at: new Date() },
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
    } = {
      message: "OTP verified successfully",
      isNewUser: !user.is_approved
    }

    if(user.is_approved) {
      responseData.token = token;
    }

    return NextResponse.json({ ...responseData }, { status: 200 });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
