import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, JWTVerifyResult } from "jose";
import { errorResponse } from "./app/utils/apiResponse";
import { HttpStatus } from "./app/utils/enums/httpStatusCode";

const CORS_HEADERS = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,DELETE,PATCH,POST,PUT,OPTIONS",
  "Access-Control-Allow-Headers":
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
};

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

async function verifyToken(token: string): Promise<JWTPayload> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  if (!secret) {
    throw new Error("JWT secret is not defined");
  }

  const { payload } = (await jwtVerify(token, secret)) as JWTVerifyResult & { payload: JWTPayload };
  return payload;
}

const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 1000;

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for") || "unknown";
}

// Middleware to protect routes
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const method = req.method;

  // Define public GET patterns
  const publicGetPatterns = [
    /^\/api\/category-data(?:\/.*)?$/,
    /^\/api\/category(?:\/.*)?$/,
    /^\/api\/sub-category(?:\/.*)?$/,
    /^\/api\/sub-category-type(?:\/.*)?$/,
    /^\/api\/brand(?:\/.*)?$/,
    /^\/api\/product(?:\/.*)?$/,
    /^\/api\/rating(?:\/.*)?$/,
    /^\/api\/search(?:\/.*)?$/,
    /^\/api\/coupon\/[^/]+$/,
    /^\/api\/coupon\/code\/[^/]+$/,
    /^\/api\/header-search$/,
    /^\/api\/coupon\/code\/[^/]+$/,
    /^\/api\/coupon\/offer(?:\/.*)?$/,
    /^\/api\/landing\/shop-by-category$/,
  ];

  // Define protected routes
  const protectedRoutes = [
    "/api/update-profile",
    "/api/show-profile",
    "/api/update-profile-img",
    "/api/gender",
    "/^\/api\/gender(\/.*)?$/",
    "/api/address",
    "/^\/api\/address(\/.*)?$/",

    "/api/category-list",
    "/api/category",
    "/^\/api\/category(\/.*)?$/",
    "/api/sub-category",
    "/^\/api\/sub-category(\/.*)?$/",
    "/api/brand",
    "/^\/api\/brand(\/.*)?$/",

    "/api/product",
    "/^\/api\/product(\/.*)?$/",

    "/api/rating",
    "/^\/api\/rating(\/.*)?$/",

    "/api/wishlist",
    "/^\/api\/wishlist(\/.*)?$/",

    "/api/cart",
    "/^\/api\/wishlist(\/.*)?$/",

    "/api/coupon",
    "/^\/api\/coupon(\/.*)?$/",
    "/api/terms",
    "/^\/api\/terms(\/.*)?$/",
    "/api/policy",
    "/^\/api\/policy(\/.*)?$/",

    "/api/orders",
    "/^\/api\/orders(\/.*)?$/",
    "/api/admin-category-settings",
    "/^\/api\/admin-category-settings(\/.*)?$/",
    "/api/shop-by-category",
    "/^\/api\/shop-by-category(\/.*)?$/",
  ];

  if (req.method === "OPTIONS") {
    return NextResponse.json(
      {},
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  }

  // Rate limiting logic
  const ip = getClientIp(req);
  const now = Date.now();
  const rateData = rateLimitMap.get(ip) || { count: 0, timestamp: now };

  if (now - rateData.timestamp < WINDOW_MS) {
    if (rateData.count >= MAX_REQUESTS) {
      return NextResponse.json(
        errorResponse("Too many requests. Please try again later", HttpStatus.TOO_MANY_REQUEST),
        {
          status: HttpStatus.TOO_MANY_REQUEST,
        }
      );
    } else {
      rateData.count++;
    }
  } else {
    rateData.count = 1;
    rateData.timestamp = now;
  }
  rateLimitMap.set(ip, rateData);

  // Check if the request is for a protected route
  if (protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Check if it's a GET request and matches public patterns
      if (method === "GET" && publicGetPatterns.some(pattern => pattern.test(path))) {
        return NextResponse.next();
      } else {
        return NextResponse.json(
          errorResponse("Unauthorized: No token provided", HttpStatus.UNAUTHORIZED),
          {
            status: HttpStatus.UNAUTHORIZED,
          }
        );
      }
    }

    try {
      const token = authHeader.split(" ")[1];
      const payload = await verifyToken(token);

      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return NextResponse.json(errorResponse("Token expired", HttpStatus.UNAUTHORIZED), {
          status: HttpStatus.UNAUTHORIZED,
        });
      }

      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-user-email", payload.email);
      requestHeaders.set("x-user-role", payload.role);
      requestHeaders.set("x-user-id", payload.userId);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json(
        errorResponse("Unauthorized: Invalid or expired token", HttpStatus.FORBIDDEN),
        {
          status: HttpStatus.FORBIDDEN,
        }
      );
    }
  }

  return NextResponse.next(); // Allow non-protected routes
}
