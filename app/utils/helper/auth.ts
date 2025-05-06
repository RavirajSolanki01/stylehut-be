import { NextRequest, NextResponse } from "next/server";
import { HttpStatus } from "../enums/httpStatusCode";
import { jwtVerify } from "jose";

export const getTokenFromHeader = (req: NextRequest) => {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { message: "Unauthorized: No token provided" },
      { status: HttpStatus.UNAUTHORIZED }
    );
  }

  return authHeader.split(" ")[1];
};

export const verifyToken = async (req: NextRequest) => {
  const token = getTokenFromHeader(req);

  if (typeof token !== "string") {
    return token;
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (err) {
    console.log(err)
    return NextResponse.json(
      { message: "Unauthorized: Invalid token" },
      { status: HttpStatus.UNAUTHORIZED }
    );
  }
};
