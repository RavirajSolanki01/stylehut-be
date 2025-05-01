import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
  try {
    // Extract Authorization header
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json(
        errorResponse("Unauthorized: No token provided", HttpStatus.UNAUTHORIZED),
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        email: string;
      };

      // Parse request body
      const body = await req.json();

      // Allowed fields for update
      const { first_name, last_name, mobile, birth_date, gender_id } = body;

      // Update user in database
      const updatedUser = await prisma.users.update({
        where: { email: decoded.email },
        data: {
          first_name,
          last_name,
          mobile,
          birth_date,
          gender_id: +gender_id,
        },
        select: {
          first_name: true,
          last_name: true,
          email: true,
          mobile: true,
          birth_date: true,
          gender_id: true,
        },
      });

      return NextResponse.json(successResponse(COMMON_CONSTANTS.SUCCESS, updatedUser), {
        status: 200,
      });
    } catch (error: unknown) {
      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          errorResponse("Unauthorized: Token expired", HttpStatus.UNAUTHORIZED),
          { status: HttpStatus.UNAUTHORIZED }
        );
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json(
          errorResponse("Unauthorized: Invalid token", HttpStatus.FORBIDDEN),
          { status: HttpStatus.FORBIDDEN }
        );
      }
      return NextResponse.json(
        errorResponse("Unauthorized: Token verification failed", HttpStatus.FORBIDDEN),
        {
          status: HttpStatus.FORBIDDEN,
        }
      );
    }
  } catch (error) {
    console.error("Update user profile error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
