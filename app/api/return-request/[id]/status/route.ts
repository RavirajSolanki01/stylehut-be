import { NextRequest, NextResponse } from "next/server";
import { returnRequestService } from "@/app/services/returnRequest.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { checkAdminRole } from "@/app/middleware/adminAuth";

type Props = {
  params: { id: string }
};

export async function PUT(request: NextRequest, { params }: Props) {
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const { id } = params;
    const data = await request.json();

    const returnRequest = await returnRequestService.updateReturnStatus(
      Number(id),
      data
    );

    return NextResponse.json(
      successResponse("Return status updated successfully", returnRequest),
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Update return status error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Failed to update return status", 
        error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR),
      { status: error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}