import { NextRequest, NextResponse } from "next/server";

import { checkAdminRole } from "@/app/middleware/adminAuth";
import { validateRequest } from "@/app/middleware/validateRequest";
import { updateAdminSettingCategorySchema } from "@/app/utils/validationSchema/admin-setting-category.validation";
import { adminSettingCategoryService } from "@/app/services/admin-setting-category.service";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";

export async function PUT(req: NextRequest) {
  try {
    const authResponse = await checkAdminRole(req);
    if (authResponse) return authResponse;

    const validation = await validateRequest(updateAdminSettingCategorySchema)(req);
    if ("status" in validation) {
      return validation;
    }

    const updated = await adminSettingCategoryService.updateAdminSettingSubcategory(
      validation.validatedData
    );
    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, {
        updated,
      }),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("Update admin setting category error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResponse = await checkAdminRole(req);
    if (authResponse) return authResponse;

    const data = await adminSettingCategoryService.getAdminSettingSubcategory();
    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, {
        data,
      }),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("Update admin setting category error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
