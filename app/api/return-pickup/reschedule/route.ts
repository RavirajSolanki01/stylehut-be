import { NextRequest, NextResponse } from "next/server";
import { returnPickupService } from "@/app/services/returnPickup.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { validateRequest } from "@/app/middleware/validateRequest";
import {
  schedulePickupSchema,
} from "@/app/utils/validationSchema/returnPickup.validation";
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pickupId = parseInt(searchParams.get("id") || "");

    if (!pickupId) {
      return NextResponse.json(
        errorResponse("Pickup ID is required", HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

		const validation = await validateRequest(schedulePickupSchema)(request);
    if ('status' in validation) {
        return validation;
    }
    const pickup = await returnPickupService.reschedulePickup(pickupId, validation.validatedData);
    
    return NextResponse.json(
      successResponse("Pickup rescheduled successfully", pickup),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("Reschedule pickup error:", error);
    return NextResponse.json(
      errorResponse("Failed to reschedule pickup", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}