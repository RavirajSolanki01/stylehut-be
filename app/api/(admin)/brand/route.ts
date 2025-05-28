import { NextRequest, NextResponse } from "next/server";
import { brandService } from "@/app/services/brand.service";
import { CreateBrandDto } from "@/app/types/brand.types";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { paginatedResponse, errorResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { createBrandSchema } from "@/app/utils/validationSchema/brand.validation";
import { checkAdminRole } from "@/app/middleware/adminAuth";
import { validateRequest } from "@/app/middleware/validateRequest";
import { checkNameConflict } from "@/app/utils/helper";
import { subCategoryService } from "@/app/services/subCategory.service";

export async function POST(request: NextRequest) {
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  const validation = await validateRequest(createBrandSchema)(request);
  if ("status" in validation) {
    return validation;
  }

  try {
    const nameExist = await checkNameConflict(validation.validatedData.name, "brand");

    if (nameExist.hasSameName && nameExist.message) {
      return NextResponse.json(errorResponse(nameExist.message, HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const subCategories = await subCategoryService.getSubCategoryByCategoryIds(
      validation.validatedData.subCategories
    );

    if (subCategories.length !== validation.validatedData.subCategories.length) {
      return NextResponse.json(
        errorResponse("Please pass valid subcategory ids", HttpStatus.NOT_FOUND),
        {
          status: HttpStatus.NOT_FOUND,
        }
      );
    }

    const brand = await brandService.createBrand(validation.validatedData as CreateBrandDto);
    return NextResponse.json(
      { message: COMMON_CONSTANTS.SUCCESS, data: brand },
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");
    const searchParam = searchParams.get("search");
    const sortByParam = searchParams.get("sortBy");
    const orderParam = searchParams.get("order");

    const search = searchParam || "";
    const sortBy = sortByParam || "create_at";
    const order = (orderParam as "asc" | "desc") || "desc";
    const page = parseInt(pageParam ? pageParam : "1") || 1;
    const pageSize = parseInt(pageSizeParam ? pageSizeParam : "10") || 10;
    const skip = (page - 1) * pageSize;

    const brands = await brandService.getAllBrands(skip, pageSize, search, sortBy, order);
    const total = brands.total;

    return NextResponse.json(
      paginatedResponse(COMMON_CONSTANTS.SUCCESS, brands.data, page, pageSize, total),
      {
        status: HttpStatus.OK,
      }
    );
  } catch (error) {
    console.error("Get list brand error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      }
    );
  }
}
