import { NextRequest, NextResponse } from "next/server";
import { addressService } from "@/app/services/address.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { validateRequest } from "@/app/middleware/validateRequest";
import { updateAddressSchema } from "@/app/utils/validationSchema/address.validation";

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
    const { id } = await params;
    const address = await addressService.getAddressById(
      Number(userId),
      Number(id)
    );

    if (!address) {
      return NextResponse.json(
        errorResponse("Address not found", HttpStatus.NOT_FOUND),
        { status: HttpStatus.NOT_FOUND }
      );
    }

    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, address),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("Get address error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      errorResponse("Unauthorized", HttpStatus.UNAUTHORIZED),
      { status: HttpStatus.UNAUTHORIZED }
    );
  }

  try {
    const validation = await validateRequest(updateAddressSchema)(request);
    if ('status' in validation) {
      return validation;
    }

    const { id } = await params;
    const address = await addressService.updateAddress(
      Number(userId),
      Number(id),
      validation.validatedData
    );

    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, address),
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Update address error:", error);
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
    const { id } = await params;
    await addressService.deleteAddress(Number(userId), Number(id));

    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS),
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Delete address error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", 
        error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR),
      { status: error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}