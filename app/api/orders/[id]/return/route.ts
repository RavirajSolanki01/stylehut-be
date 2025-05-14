import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/app/services/order.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { validateRequest } from "@/app/middleware/validateRequest";
import { createReturnRequestSchema } from "@/app/utils/validationSchema/order.validation";

type Props = {
  params: { id: string };
};

export async function POST(request: NextRequest, { params }: Props) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      errorResponse("Unauthorized", HttpStatus.UNAUTHORIZED),
      { status: HttpStatus.UNAUTHORIZED }
    );
  }

  try {
    const validation = await validateRequest(createReturnRequestSchema)(request);
    if ('status' in validation) {
      return validation;
    }

    const returnRequest = await orderService.createReturnRequest(
      Number(userId),
      Number(params.id),
      validation.validatedData
    );

    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, returnRequest),
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Create return request error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", 
        error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR),
      { status: error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}