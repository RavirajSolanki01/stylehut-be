import { NextRequest, NextResponse } from "next/server";
import { returnPickupService } from "@/app/services/returnPickup.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { 
  schedulePickupSchema, 
  updatePickupStatusSchema 
} from "@/app/utils/validationSchema/returnPickup.validation";
import { validateRequest } from "@/app/middleware/validateRequest";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(schedulePickupSchema)(request);
    if ('status' in validation) {
        return validation;
    }

    const pickup = await returnPickupService.schedulePickup(validation.validatedData);
    
    return NextResponse.json(
      successResponse("Pickup scheduled successfully", pickup),
      { status: HttpStatus.CREATED }
    );
  } catch (error) {
    console.error("Schedule pickup error:", error);
    return NextResponse.json(
      errorResponse("Failed to schedule pickup", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pickupId = parseInt(searchParams.get("id") || "");
    const body = await request.json();

    if (!pickupId || isNaN(pickupId)) {
      return NextResponse.json(
        errorResponse("Valid pickup ID is required", HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const validation = await validateRequest(updatePickupStatusSchema)(request);
    if ('status' in validation) {
        return validation;
    }

    // Validate input
    const validationResult = updatePickupStatusSchema.safeParse(validation.validatedData);
    if (!validationResult.success) {
      return NextResponse.json(
        errorResponse(
          "Invalid input", 
          HttpStatus.BAD_REQUEST, 
          validationResult.error.issues
        ),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const pickup = await returnPickupService.updatePickupStatus(
      pickupId, 
      validationResult.data
    );
    
    return NextResponse.json(
      successResponse("Pickup status updated successfully", pickup),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("Update pickup status error:", error);
    return NextResponse.json(
      errorResponse("Failed to update pickup status", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}