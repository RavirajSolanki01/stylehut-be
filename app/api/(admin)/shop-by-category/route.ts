import { NextRequest, NextResponse } from "next/server";
import { shopByCategoryService } from "@/app/services/shop-by-category.service";
import { errorResponse, paginatedResponse, successResponse } from "@/app/utils/apiResponse";
import { subCategoryService } from "@/app/services/subCategory.service";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { parseForm } from "@/app/utils/helper/formDataParser";
import { checkAdminRole } from "@/app/middleware/adminAuth";
import { validateRequest } from "@/app/middleware/validateRequest";
import {
  createShopByCategorySchema,
  shopByCategoryQuerySchema,
} from "@/app/utils/validationSchema/shop-by-category.validation";
// Configure Next.js to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const { fields, files } = await parseForm(request);
    const validation = await validateRequest(createShopByCategorySchema, {
      type: "formdata",
      numberFields: ["minDiscount", "maxDiscount", "sub_category_id"],
      fileFields: ["images"],
    })({ ...fields, ...files });
    if ("status" in validation) {
      return validation;
    }

    // Validate sub_category_id
    if (!(await subCategoryService.exists(fields.sub_category_id?.[0]))) {
      return NextResponse.json(errorResponse("Invalid sub_category_id", HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const productData = {
      name: fields.name?.[0] || "",
      minDiscount: parseInt(fields.minDiscount?.[0] || "0"),
      maxDiscount: parseInt(fields.maxDiscount?.[0] || "0"),
      sub_category_id: parseInt(fields.sub_category_id?.[0] || "0"),
      user_id: parseInt(request.headers.get("x-user-id") || "0"),
    };

    const images = Array.isArray(files.images) ? files.images : files.images ? [files.images] : [];

    const product = await shopByCategoryService.createShopByCategory(productData, images);

    return NextResponse.json(successResponse(COMMON_CONSTANTS.SUCCESS, product), {
      status: HttpStatus.OK,
    });
  } catch (error) {
    console.error("Create shop by category error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const validatedQuery = await shopByCategoryQuerySchema.parseAsync({
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "10",
      search: searchParams.get("search") || "",
      sortBy: searchParams.get("sortBy") || "create_at",
      order: searchParams.get("order") || "desc",
    });

    const { data, total } = await shopByCategoryService.getAllShopByCategory(validatedQuery);

    return NextResponse.json(
      paginatedResponse(
        COMMON_CONSTANTS.SUCCESS,
        data,
        validatedQuery.page,
        validatedQuery.pageSize,
        total
      ),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("Get shop by category error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
