import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/app/services/order.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { checkAdminRole } from "@/app/middleware/adminAuth";

type Props = {
  params: { id: string };
};

// Update refund status
export async function PUT(request: NextRequest, { params }: Props) {
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const { id } = params;
    const { refundId, status } = await request.json();

    if (!refundId || !status) {
      return NextResponse.json(
        errorResponse("Refund ID and status are required", HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    await orderService.updateRefundStatus(Number(id), refundId, status);

    return NextResponse.json(
      successResponse("Refund status updated successfully"),
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Update refund status error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", 
        error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR),
      { status: error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}