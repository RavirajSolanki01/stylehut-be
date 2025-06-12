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
    const nameExist = await checkNameConflict(validation.validatedData.name, "brand", {
      excludeId: Number(id),
    });

    if (nameExist.hasSameName && nameExist.message) {
      return NextResponse.json(errorResponse(nameExist.message, HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const brand = await brandService.updateBrand(
      Number(id),
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
