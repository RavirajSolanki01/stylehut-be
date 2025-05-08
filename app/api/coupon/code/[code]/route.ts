import { couponService } from "@/app/services/coupon.service";
import { errorResponse } from "@/app/utils/apiResponse";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { NextRequest, NextResponse } from "next/server";

type Props = {
  params: {
    code: string;
  };
};

export async function GET(_: NextRequest, { params }: Props) {
  try {

    const { code } = await params;
    const coupon = await couponService.getCouponByCode(code);

    return NextResponse.json(
      {
        status: HttpStatus.OK,
        success: true,
        message: COMMON_CONSTANTS.SUCCESS,
        data: coupon,
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
