import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/app/services/order.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { validateRequest } from "@/app/middleware/validateRequest";
import { approveReturnSchema } from "@/app/utils/validationSchema/order.validation";
import { checkAdminRole } from "@/app/middleware/adminAuth";

type Props = {
  params: { id: string };
};

// Approve return request
export async function PUT(request: NextRequest, { params }: Props) {
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const { id } = params;
    const validation = await validateRequest(approveReturnSchema)(request);
    if ('status' in validation) {
      return validation;
    }

    await orderService.approveReturn(Number(id), validation.validatedData);

    return NextResponse.json(
      successResponse("Return request approved successfully"),
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Approve return error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", 
        error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR),
      { status: error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

// Reject return request
export async function DELETE(request: NextRequest, { params }: Props) {
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const { id } = params;
    const { reason } = await request.json();

    if (!reason) {
      return NextResponse.json(
        errorResponse("Rejection reason is required", HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    await orderService.rejectReturn(Number(id), reason);

    return NextResponse.json(
      successResponse("Return request rejected successfully"),
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Reject return error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", 
        error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR),
      { status: error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}