import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type Props = {
    params: Promise<{ email: string }>;
};

export async function GET(request: NextRequest, { params }: Props) {
    try {
      const { email } = await params;
      if (!email) {
        return NextResponse.json({ message: "Email is required" }, { status: 400 });
      }
  
      // Check if user exists
			const user = await prisma.users.findUnique({ where: { email }, include: { role: true } });
			if (!user) {
				return NextResponse.json({ message: "Admin User not found" }, { status: 404 });
			}
			console.log("🚀 ~ GET ~ user:", user)

			let responseData: {
				message: string;
				is_approved: boolean;
				role?: string;
			} = {
				message: user.is_approved ? "User is already approved!" : "User is not approved yet!",
				is_approved: user.is_approved,
				role: user.role?.name
			}
	
			return NextResponse.json({ ...responseData }, { status: 200 });
  
    } catch (error) {
      console.error("OTP Request error:", error);
      return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
  }
  