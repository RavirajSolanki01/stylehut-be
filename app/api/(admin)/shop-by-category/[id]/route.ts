import { NextRequest, NextResponse } from "next/server";
import { shopByCategoryService } from "@/app/services/shop-by-category.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { parseForm } from "@/app/utils/helper/formDataParser";
import { checkAdminRole } from "@/app/middleware/adminAuth";
import { validateRequest } from "@/app/middleware/validateRequest";
import { updateShopByCategorySchema } from "@/app/utils/validationSchema/shop-by-category.validation";
import { subCategoryService } from "@/app/services/subCategory.service";
// Configure Next.js to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

type Props = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: Props) {
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const { id } = await params;
    const { fields, files } = await parseForm(request);

    // Validate sub_category_id if provided
    if (fields.sub_category_id) {
      if (!(await subCategoryService.exists(parseInt(fields.sub_category_id[0])))) {
        return NextResponse.json(errorResponse("Invalid sub_category_id", HttpStatus.BAD_REQUEST), {
          status: HttpStatus.BAD_REQUEST,
        });
      }
    }

    // Prepare update data
    const updateData = {
      name: fields.name?.[0].trim(),
      minDiscount: fields.minDiscount ? parseInt(fields.minDiscount[0]) : undefined,
      maxDiscount: fields.maxDiscount ? parseInt(fields.maxDiscount[0]) : undefined,
      sub_category_id: fields.sub_category_id ? parseInt(fields.sub_category_id[0]) : undefined,
    };

    // Check for duplicate entry if any key fields are being updated
    if (
      updateData.name ||
      updateData.sub_category_id ||
      updateData.minDiscount ||
      updateData.maxDiscount
    ) {
      const existingShop = await shopByCategoryService.getShopByCategory(parseInt(id));
      if (!existingShop) {
        return NextResponse.json(
          errorResponse("Shop By Category not found", HttpStatus.NOT_FOUND),
          { status: HttpStatus.NOT_FOUND }
        );
      }

      const duplicate = await shopByCategoryService.checkDuplicateShop(parseInt(id), {
        name: updateData.name || existingShop.name,
        sub_category_id: updateData.sub_category_id || existingShop.sub_category_id,
        minDiscount: updateData.minDiscount || existingShop.minDiscount,
        maxDiscount: updateData.maxDiscount || existingShop.maxDiscount,
      });

      if (duplicate) {
        return NextResponse.json(
          errorResponse(
            "A shop with the same name, subcategory, and discount range already exists",
            HttpStatus.CONFLICT
          ),
          { status: HttpStatus.CONFLICT }
        );
      }
    }

    const validation = await validateRequest(updateShopByCategorySchema, {
      type: "formdata",
      numberFields: ["minDiscount", "maxDiscount", "sub_category_id"],
      fileFields: ["images"],
    })({ ...fields, ...files });
    if ("status" in validation) {
      return validation;
    }

    if (!(await subCategoryService.exists(fields.sub_category_id?.[0]))) {
      return NextResponse.json(errorResponse("Invalid sub_category_id", HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const productData = {
      ...(fields.name?.[0] && { name: fields.name[0] }),
      ...(fields.minDiscount?.[0] && { minDiscount: parseInt(fields.minDiscount[0]) }),
      ...(fields.maxDiscount?.[0] && { maxDiscount: parseInt(fields.maxDiscount[0]) }),
      ...(fields.sub_category_id?.[0] && { sub_category_id: parseInt(fields.sub_category_id[0]) }),
    };

    // Convert files to array if new images are uploaded
    const images = files?.images
      ? Array.isArray(files.images)
        ? files.images
        : [files.images]
      : undefined;

    const product = await shopByCategoryService.updateShopByCategory(
      Number(id),
      productData,
      images
    );
    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, {
        product,
      }),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const shopByCategory = await shopByCategoryService.getShopByCategory(Number(id));
    if (!shopByCategory) {
      return NextResponse.json(errorResponse("Shop By Category not found", HttpStatus.NOT_FOUND), {
        status: HttpStatus.NOT_FOUND,
      });
    }
    return NextResponse.json(successResponse(COMMON_CONSTANTS.SUCCESS, shopByCategory), {
      status: HttpStatus.OK,
    });
  } catch (error) {
    console.error("Get shop by category error:", error);
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

    const shopByCategory = await shopByCategoryService.getShopByCategory(Number(id));
    if (!shopByCategory) {
      return NextResponse.json(errorResponse("Shop By Category not found", HttpStatus.NOT_FOUND), {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const product = await shopByCategoryService.deleteShopByCategory(Number(id));
    return NextResponse.json(successResponse(COMMON_CONSTANTS.SUCCESS, product), {
      status: HttpStatus.OK,
    });
  } catch (error) {
    console.error("Delete shop by category error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
