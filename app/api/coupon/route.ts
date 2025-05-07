import { validateRequest } from "@/app/middleware/validateRequest";
import { errorResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { NextRequest, NextResponse } from "next/server";
import { createCouponSchema } from "@/app/utils/validationSchema/coupon.validation";
import { couponService } from "@/app/services/coupon.service";
import { checkAdminRole } from "@/app/middleware/adminAuth";

export async function POST(request: NextRequest) {
  const authResponse = await checkAdminRole(request);

  if (authResponse) return authResponse;

  try {
    const validation = await validateRequest(createCouponSchema)(request);
    
    if ('status' in validation) {
      return validation;
    }
    
    const { validatedData } = validation;

    // Check if coupon code already exists
    const existingCoupon = await couponService.getCouponByCode(validatedData.coupon_code);
    if (existingCoupon) {
      return NextResponse.json(
        errorResponse("Coupon code already exists", HttpStatus.CONFLICT),
        { status: HttpStatus.CONFLICT }
      );
    }

    const coupon = await couponService.createCoupon(validatedData);
    
    return NextResponse.json(
      {
        success: true,
        message: "Coupon created successfully",
        data: coupon
      },
      { status: HttpStatus.CREATED }
    );
  } catch (error: any) {
    console.error("Create coupon error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function GET(request: NextRequest) {
  const authResponse = await checkAdminRole(request);

  if (authResponse) return authResponse;

  try {
    const coupons = await couponService.getAllCoupons();

    return NextResponse.json(
      {
        success: true,
        message: "Coupons fetched successfully",
        data: coupons
      },
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Get coupons error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

