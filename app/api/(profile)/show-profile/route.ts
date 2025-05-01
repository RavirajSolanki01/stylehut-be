import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { USER_CONSTANTS, COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
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

      // Fetch user from database
      const user = await prisma.users.findUnique({
        where: { email: decoded.email },
        select: {
          first_name: true,
          last_name: true,
          email: true,
          mobile: true,
          birth_date: true,
          gender_id: true,
          profile_url: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          errorResponse(USER_CONSTANTS.NOT_EXISTS_OR_DELETED, HttpStatus.NOT_FOUND),
          {
            status: HttpStatus.NOT_FOUND,
          }
        );
      }
      return NextResponse.json(successResponse(COMMON_CONSTANTS.SUCCESS, user), {
        status: HttpStatus.OK,
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
    console.error("Fetch user profile error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
