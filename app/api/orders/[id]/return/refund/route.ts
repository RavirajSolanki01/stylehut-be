import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/app/services/order.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { validateRequest } from "@/app/middleware/validateRequest";
import { processReturnSchema } from "@/app/utils/validationSchema/order.validation";
import { checkAdminRole } from "@/app/middleware/adminAuth";

type Props = {
  params: { id: string };
};

// Process refund
export async function POST(request: NextRequest, { params }: Props) {
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const { id } = params;
    const validation = await validateRequest(processReturnSchema)(request);
    if ('status' in validation) {
      return validation;
    }

    await orderService.processReturnRefund(Number(id), validation.validatedData);

    return NextResponse.json(
      successResponse("Return refund processed successfully"),
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Process return refund error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", 
        error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR),
      { status: error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}