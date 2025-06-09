import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/app/services/order.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { validateRequest } from "@/app/middleware/validateRequest";
import { processReturnQCSchema } from "@/app/utils/validationSchema/order.validation";
import { checkAdminRole } from "@/app/middleware/adminAuth";

type Props = {
  params: { id: string };
};

// Process quality check
export async function POST(request: NextRequest, { params }: Props) {
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const { id } = params;
    const validation = await validateRequest(processReturnQCSchema)(request);
    if ('status' in validation) {
      return validation;
    }

    await orderService.processQualityCheck(Number(id), validation.validatedData);

    return NextResponse.json(
      successResponse("Quality check completed successfully"),
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Process quality check error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", 
        error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR),
      { status: error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}