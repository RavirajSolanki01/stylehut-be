import { NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { checkAdminRole } from "@/app/middleware/adminAuth";
import { validateRequest } from "@/app/middleware/validateRequest";
import { productAdditionalKeySchema } from "@/app/utils/validationSchema/product.validation";
import { productService } from "@/app/services/product.service";

export async function POST(request: NextRequest) {
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const validation = await validateRequest(productAdditionalKeySchema)(request);
    if ("status" in validation) {
      return validation;
    }

    const {
      validatedData: { name },
    } = validation;

    const isPresent = await productService.checkProductSpecificationKeyPresent(name);
    if (isPresent) {
      return NextResponse.json(
        errorResponse("Specification key already exists", HttpStatus.BAD_REQUEST),
        {
          status: HttpStatus.BAD_REQUEST,
        }
      );
    }

    const result = await productService.createProductSpecificationKey({ name });

    return NextResponse.json(successResponse("Specification key created successfully", result), {
      status: HttpStatus.OK,
    });
  } catch (error) {
    console.error("Create additional details key error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
