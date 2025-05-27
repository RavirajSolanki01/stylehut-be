import { NextRequest, NextResponse } from "next/server";
import { brandService } from "@/app/services/brand.service";
import { checkAdminRole } from "@/app/middleware/adminAuth";
import { UpdateBrandDto } from "@/app/types/brand.types";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { errorResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { createBrandSchema } from "@/app/utils/validationSchema/brand.validation";
import { validateRequest } from "@/app/middleware/validateRequest";
import { checkNameConflict } from "@/app/utils/helper";
import { subCategoryService } from "@/app/services/subCategory.service";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const brand = await brandService.getBrandById(Number(id));
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
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

export async function PUT(request: NextRequest, { params }: Props) {
  // Check admin authorization
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  const validation = await validateRequest(createBrandSchema)(request);
  if ("status" in validation) {
    return validation;
  }

  try {
    const { id } = await params;
    const brandId = Number(id);
    // Check for name conflict with other brands if name is being updated

    const existingBrand = await brandService.getBrandById(brandId);
    if (!existingBrand) {
      return NextResponse.json(errorResponse("Brand not found", HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    if (validation.validatedData.name) {
      const nameConflict = await checkNameConflict(
        validation.validatedData.name,
        "brand",
        { excludeId: brandId } // Pass the current brand ID to exclude it from the conflict check
      );

      if (nameConflict.hasSameName && nameConflict.message) {
        return NextResponse.json(errorResponse(nameConflict.message, HttpStatus.BAD_REQUEST), {
          status: HttpStatus.BAD_REQUEST,
        });
      }
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

    const brand = await brandService.updateBrand(
      brandId,
      validation.validatedData as UpdateBrandDto
    );
    return NextResponse.json(
      { message: COMMON_CONSTANTS.SUCCESS, data: brand },
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2002") {
      return NextResponse.json(errorResponse("Gender already exists", HttpStatus.CONFLICT), {
        status: HttpStatus.CONFLICT,
      });
    }

    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  // Check admin authorization
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const { id } = await params;
    await brandService.deleteBrand(Number(id));
    return NextResponse.json({ message: "Brand deleted successfully" });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
