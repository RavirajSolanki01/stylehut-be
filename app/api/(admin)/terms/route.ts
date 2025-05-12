import { checkAdminRole } from "@/app/middleware/adminAuth";
import { termsService } from "@/app/services/terms.service";
import { errorResponse } from "@/app/utils/apiResponse";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { NextResponse } from "next/server";

import { NextRequest } from "next/server";

export async function GET() {
  const terms = await termsService.getTerms();

  return NextResponse.json(
    { message: COMMON_CONSTANTS.SUCCESS, data: terms },
    { status: HttpStatus.OK }
  );
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;
  try {
    const terms = await termsService.createTerms(data);
    return NextResponse.json(
      { message: COMMON_CONSTANTS.SUCCESS, data: terms },
      { status: HttpStatus.OK }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("Error creating terms", HttpStatus.BAD_REQUEST),
      { status: HttpStatus.BAD_REQUEST }
    );
  }
}

export async function PUT(request: NextRequest) {
  const data = await request.json();
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const terms = await termsService.updateTerms(data);
    return NextResponse.json(
      { message: COMMON_CONSTANTS.SUCCESS, data: terms },
      { status: HttpStatus.OK }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("Error updating terms", HttpStatus.BAD_REQUEST),
      { status: HttpStatus.BAD_REQUEST }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const data = await request.json();
  const terms = await termsService.deleteTerms(data);
  return NextResponse.json(
    { message: COMMON_CONSTANTS.SUCCESS, data: terms },
    { status: HttpStatus.OK }
  );
}
