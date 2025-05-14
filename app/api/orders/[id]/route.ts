import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/app/services/order.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";

type Props = {
  params: { id: string };
};

export async function GET(request: NextRequest, { params }: Props) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      errorResponse("Unauthorized", HttpStatus.UNAUTHORIZED),
      { status: HttpStatus.UNAUTHORIZED }
    );
  }

  try {
    const order = await orderService.getOrderById(
      Number(userId),
      Number(params.id)
    );

    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, order),
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Get order error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", 
        error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR),
      { status: error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      errorResponse("Unauthorized", HttpStatus.UNAUTHORIZED),
      { status: HttpStatus.UNAUTHORIZED }
    );
  }

  try {
    const { reason } = await request.json();
    const order = await orderService.cancelOrder(
      Number(userId),
      Number(params.id),
      reason
    );

    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, order),
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Cancel order error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", 
        error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR),
      { status: error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}