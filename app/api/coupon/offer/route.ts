import { errorResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { NextRequest, NextResponse } from "next/server";
import { couponService } from "@/app/services/coupon.service";
import { COMMON_CONSTANTS } from "@/app/utils/constants";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cart_amount = searchParams.get("cart_amount");

    const couponForUser = await couponService.getCouponForUser({
      cart_amount: Number(cart_amount),
    });

    return NextResponse.json(
      {
        status: HttpStatus.OK,
        success: true,
        message: COMMON_CONSTANTS.SUCCESS,
        data: {
          couponForUser,
        },
      },
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Get coupon by code error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
