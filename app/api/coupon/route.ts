import { validateRequest } from "@/app/middleware/validateRequest";
import { errorResponse, paginatedResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { NextRequest, NextResponse } from "next/server";
import { createCouponSchema } from "@/app/utils/validationSchema/coupon.validation";
import { couponService } from "@/app/services/coupon.service";
import { checkAdminRole } from "@/app/middleware/adminAuth";
import { COMMON_CONSTANTS } from "@/app/utils/constants";

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
    
    const coupon = await couponService.createCoupon({
      coupon_code: validatedData.coupon_code,
      discount: validatedData.discount,
      min_order_amount: validatedData.min_order_amount,
      discount_text: validatedData.discount_text,
      max_savings_amount: validatedData.max_savings_amount,
      expiry_date: validatedData.expiry_date,
      is_active: validatedData.is_active
    });
    
    return NextResponse.json(
      {
        status: HttpStatus.OK,
        success: true,
        message: "Coupon created successfully",
        data: coupon
      },
      { status: HttpStatus.OK }
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const { data, total } = await couponService.getAllCoupons({ page, pageSize });

    return NextResponse.json(
      {
        status: HttpStatus.OK,
        success: true,
        message: COMMON_CONSTANTS.SUCCESS,
        data: {
          items: data,
          meta: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
          }
        }
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

