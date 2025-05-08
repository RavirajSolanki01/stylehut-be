import { checkAdminRole } from "@/app/middleware/adminAuth";
import { validateRequest } from "@/app/middleware/validateRequest";
import { couponService } from "@/app/services/coupon.service";
import { errorResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { updateCouponSchema } from "@/app/utils/validationSchema/coupon.validation";
import { NextRequest, NextResponse } from "next/server";

type Props = {
  params: Promise<{ id: string }>;
};



export async function PUT(request: NextRequest, { params }: Props) {
  const authResponse = await checkAdminRole(request);

  if (authResponse) return authResponse;

  try {
    const validation = await validateRequest(updateCouponSchema)(request);

    if ("status" in validation) {
      return validation;
    }

    const { validatedData } = validation;

    const { id } = await params;

    const existingCoupon = await couponService.getCouponByCode(validatedData.coupon_code, Number(id));
    if (existingCoupon) {
      return NextResponse.json(
        errorResponse("Coupon code already exists", HttpStatus.CONFLICT),
        { status: HttpStatus.CONFLICT }
      );
    }
    

    const coupon = await couponService.updateCoupon(Number(id), validatedData);

    return NextResponse.json(
      {
        success: true,
        message: "Coupon updated successfully",
        data: coupon,
      },
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Update coupon error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const authResponse = await checkAdminRole(request);

  if (authResponse) return authResponse;

  try {
    const { id } = await params;
    const coupon = await couponService.getCoupon(id);
    if (!coupon) {
      return NextResponse.json(
        errorResponse("Coupon not found", HttpStatus.NOT_FOUND),
        { status: HttpStatus.NOT_FOUND }
      );
    }
    await couponService.deleteCoupon(Number(id));

    return NextResponse.json(
      {
        success: true,
        message: "Coupon deleted successfully",
        data: coupon,
      },
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Delete coupon error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function GET(request: NextRequest, { params }: Props) {
  const authResponse = await checkAdminRole(request);

  if (authResponse) return authResponse;

  try {
    const { id } = await params;
    const coupon = await couponService.getCoupon(id);

    return NextResponse.json(
      {
        success: true,
        message: "Coupon fetched successfully",
        data: coupon,
      },
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Get coupon error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
