import { checkAdminRole } from "@/app/middleware/adminAuth";
import { policyService } from "@/app/services/policy.service";
import { errorResponse } from "@/app/utils/apiResponse";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { NextResponse } from "next/server";

import { NextRequest } from "next/server";

export async function GET() {
  const policy = await policyService.getPolicy();

  return NextResponse.json(
    { message: COMMON_CONSTANTS.SUCCESS, data: policy },
    { status: HttpStatus.OK }
  );
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;
  try {
    const policy = await policyService.createPolicy(data);
    return NextResponse.json(
      { message: COMMON_CONSTANTS.SUCCESS, data: policy },
      { status: HttpStatus.OK }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("Error creating policy", HttpStatus.BAD_REQUEST),
      { status: HttpStatus.BAD_REQUEST }
    );
  }
}

export async function PUT(request: NextRequest) {
  const data = await request.json();
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const policy = await policyService.updatePolicy(data);
    return NextResponse.json(
      { message: COMMON_CONSTANTS.SUCCESS, data: policy },
      { status: HttpStatus.OK }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("Error updating policy", HttpStatus.BAD_REQUEST),
      { status: HttpStatus.BAD_REQUEST }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const data = await request.json();
  const policy = await policyService.deletePolicy(data);
  return NextResponse.json(
    { message: COMMON_CONSTANTS.SUCCESS, data: policy },
    { status: HttpStatus.OK }
  );
}
