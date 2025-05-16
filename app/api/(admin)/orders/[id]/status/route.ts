import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/app/services/order.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { validateRequest } from "@/app/middleware/validateRequest";
import { updateOrderAdminSchema } from "@/app/utils/validationSchema/order.validation";
import { checkAdminRole } from "@/app/middleware/adminAuth";

type Props = {
  params: { id: string };
};

export async function PUT(request: NextRequest, { params }: Props) {
  // Check admin authorization
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const validation = await validateRequest(updateOrderAdminSchema)(request);
    if ('status' in validation) {
      return validation;
    }

    const orderId = await Number(params.id);
    const order = await orderService.updateOrderStatus(
      Number(orderId),
      validation.validatedData
    );

    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, order),
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Update order status error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", 
        error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR),
      { status: error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}