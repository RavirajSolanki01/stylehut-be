import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

interface AuthResult {
  authorized: boolean;
  user?: any;
  message?: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return { authorized: false, message: "No token provided" };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user) {
      return { authorized: false, message: "User not found" };
    }

    if (user.is_deleted) {
      return { authorized: false, message: "User account is deleted" };
    }

    return { authorized: true, user };
  } catch (error) {
    return { authorized: false, message: "Invalid token" };
  }
}