import { NextRequest, NextResponse } from "next/server";
import { errorResponse, paginatedResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { checkAdminRole } from "@/app/middleware/adminAuth";
import { validateRequest } from "@/app/middleware/validateRequest";
import { productAdditionalKeySchema } from "@/app/utils/validationSchema/product.validation";
import { productService } from "@/app/services/product.service";
import { z } from "zod";
import { COMMON_CONSTANTS } from "@/app/utils/constants";

// Schema for query parameters
const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default("10"),
  sortBy: z.string().optional().default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  search: z.string().optional().default(""),
});

export async function GET(request: NextRequest) {
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedQuery = paginationQuerySchema.safeParse(query);
    if (!validatedQuery.success) {
      return NextResponse.json(
        errorResponse(
          "Invalid query parameters",
          HttpStatus.BAD_REQUEST,
          validatedQuery.error.issues
        ),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const { page, limit, sortBy, sortOrder, search } = validatedQuery.data;

    const result = await productService.getAllProductAdditionalKey({
      page,
      limit,
      sortBy,
      sortOrder,
      search,
    });

    return NextResponse.json(
      paginatedResponse(COMMON_CONSTANTS.SUCCESS, result.data, page, limit, result.meta.total),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("Get additional details keys error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

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

    const isPresent = await productService.checkProductAdditionalKeyPresent(name);
    if (isPresent) {
      return NextResponse.json(
        errorResponse("Additional details key already exists", HttpStatus.BAD_REQUEST),
        {
          status: HttpStatus.BAD_REQUEST,
        }
      );
    }

    const result = await productService.createProductAdditionalKey({ name });

    return NextResponse.json(successResponse("Additional details created successfully", result), {
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
