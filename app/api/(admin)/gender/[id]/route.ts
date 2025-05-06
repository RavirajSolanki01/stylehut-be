import { NextRequest, NextResponse } from "next/server";
import { genderService } from "@/app/services/gender.service";
import { updateGenderSchema } from "@/app/utils/validationSchema/gender.validation";
import { validateRequest } from "@/app/middleware/validateRequest";
import { errorResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { checkAdminRole } from "@/app/middleware/adminAuth";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const gender = await genderService.getGenderById(Number(id));
    if (!gender) {
      return NextResponse.json(
        errorResponse("Gender not found", HttpStatus.NOT_FOUND),
        { status: HttpStatus.NOT_FOUND }
      );
    }
    return NextResponse.json(
      { message: COMMON_CONSTANTS.SUCCESS, data: gender },
      { status: HttpStatus.OK }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const { id } = await params;
    const validation = await validateRequest(updateGenderSchema)(request);
    if ('status' in validation) {
      return validation;
    }

    const gender = await genderService.updateGender(Number(id), validation.validatedData);
    return NextResponse.json(
      { message: COMMON_CONSTANTS.SUCCESS, data: gender },
      { status: HttpStatus.OK }
    );
  } catch (error: any) {

    if (error.code === 'P2002') {
      return NextResponse.json(
        errorResponse("Gender already exists", HttpStatus.CONFLICT),
        { status: HttpStatus.CONFLICT }
      );
    }

    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const { id } = await params;
    await genderService.deleteGender(Number(id));
    return NextResponse.json(
      { message: COMMON_CONSTANTS.SUCCESS },
      { status: HttpStatus.OK }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}