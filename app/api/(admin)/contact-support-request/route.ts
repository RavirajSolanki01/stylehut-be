import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { errorResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { sendDeativatedUserContactSupportEmail } from "@/app/services/mail.service";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(errorResponse("Email is required", 400), { status: 400 });
    }

    const user = await prisma.users.findFirst({ where: { email } });

    if (!user) {
      return NextResponse.json(errorResponse("User not found", HttpStatus.NOT_FOUND), {
        status: HttpStatus.NOT_FOUND,
      });
    }

    await sendDeativatedUserContactSupportEmail(
      user.email,
      `${user.first_name} ${user.last_name}` || "N.A."
    );

    return NextResponse.json("Your request has been received. We’ll get back to you soon.", {
      status: HttpStatus.OK,
    });
  } catch (error) {
    console.error("Admin error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
