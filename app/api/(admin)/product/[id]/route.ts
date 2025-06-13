import { NextRequest, NextResponse } from "next/server";
import { productService } from "@/app/services/product.service";
import { errorResponse } from "@/app/utils/apiResponse";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";

import { parseForm } from "@/app/utils/helper/formDataParser";
import { updateProductSchema } from "@/app/utils/validationSchema/product.validation";
import { checkAdminRole } from "@/app/middleware/adminAuth";
import { validateRequest } from "@/app/middleware/validateRequest";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const product = await productService.getProductById(Number(id));
    if (!product) {
      return NextResponse.json(errorResponse("Product not found", HttpStatus.NOT_FOUND), {
        status: HttpStatus.NOT_FOUND,
      });
    }
    return NextResponse.json(
      { message: COMMON_CONSTANTS.SUCCESS, data: product },
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("Get product error:", error);
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
    const { fields, files } = await parseForm(request);

    const validation = await validateRequest(updateProductSchema, {
      type: "formdata",
      numberFields: [
        "price",
        "discount",
        "category_id",
        "sub_category_id",
        "sub_category_type_id",
        "brand_id",
      ],
      fileFields: ["images"],
      jsonFields: ["product_additional_details", "product_specifications"],
    })({ ...fields, ...files });
    if ("status" in validation) {
      return validation;
    }

    const productData = {
      ...(fields.name?.[0] && { name: fields.name[0] }),
      ...(fields.description?.[0] && { description: fields.description[0] }),
      ...(fields.price?.[0] && { price: parseFloat(fields.price[0]) }),
      ...(fields.discount?.[0] && { discount: parseInt(fields.discount[0]) }),
      ...(fields.category_id?.[0] && { category_id: parseInt(fields.category_id[0]) }),
      ...(fields.sub_category_id?.[0] && { sub_category_id: parseInt(fields.sub_category_id[0]) }),
      ...(fields.sub_category_type_id?.[0] && {
        sub_category_type_id: parseInt(fields.sub_category_type_id[0]),
      }),
      ...(fields.brand_id?.[0] && { brand_id: parseInt(fields.brand_id[0]) }),
      ...(fields.size_quantity_id?.[0] && {
        size_quantity_id: parseInt(fields.size_quantity_id[0]),
      }),
      ...(fields.product_additional_details && {
        product_additional_details: fields.product_additional_details
          ? (() => {
              let details = fields.product_additional_details;
              if (typeof details === "string") {
                details = JSON.parse(details);
              }
              if (Array.isArray(details) && details.length === 1 && Array.isArray(details[0])) {
                details = details[0];
              }
              if (!Array.isArray(details)) return [];

              return details.map((item: any) => ({
                id: Number(item.id),
                value: String(item.value),
              }));
            })()
          : [],
      }),
      ...(fields.product_specifications && {
        product_specifications: fields.product_specifications
          ? (() => {
              let specs = fields.product_specifications;
              if (typeof specs === "string") {
                specs = JSON.parse(specs);
              }
              if (Array.isArray(specs) && specs.length === 1 && Array.isArray(specs[0])) {
                specs = specs[0];
              }
              if (!Array.isArray(specs)) return [];

              return specs.map((item: any) => ({
                id: Number(item.id),
                value: String(item.value),
              }));
            })()
          : [],
      }),
    };

    // Convert files to array if new images are uploaded
    const images = files.images
      ? Array.isArray(files.images)
        ? files.images
        : [files.images]
      : undefined;

    if (
      productData.product_additional_details &&
      productData.product_additional_details.length > 0
    ) {
      const productAdditionalDetailIds = productData.product_additional_details.map(
        spec => spec.id
      );

      // Check if all specification keys exist and are not deleted
      const existingKeys = await prisma.product_additional_detail_key.findMany({
        where: {
          id: { in: productAdditionalDetailIds },
          is_deleted: false,
        },
        select: { id: true },
      });
      // Check if any specified key is missing
      const existingKeyIds = new Set(existingKeys.map(key => key.id));
      const missingKeys = productAdditionalDetailIds.filter(id => !existingKeyIds.has(id));

      if (missingKeys.length > 0) {
        return NextResponse.json(
          errorResponse(
            `Some additional detail keys are missing or deleted in product additional details: ${missingKeys.join(", ")}`,
            HttpStatus.BAD_REQUEST
          ),
          { status: HttpStatus.BAD_REQUEST }
        );
      }
    }

    if (productData.product_specifications && productData.product_specifications.length > 0) {
      const specificationKeyIds = productData.product_specifications.map(spec => spec.id);

      // Check if all specification keys exist and are not deleted
      const existingKeys = await prisma.product_specification_key.findMany({
        where: {
          id: { in: specificationKeyIds },
          is_deleted: false,
        },
        select: { id: true },
      });

      // Check if any specified key is missing
      const existingKeyIds = new Set(existingKeys.map(key => key.id));
      const missingKeys = specificationKeyIds.filter(id => !existingKeyIds.has(id));

      if (missingKeys.length > 0) {
        return NextResponse.json(
          errorResponse(
            `Some additional detail keys are missing or deleted in specification keys: ${missingKeys.join(", ")}`,
            HttpStatus.BAD_REQUEST
          ),
          { status: HttpStatus.BAD_REQUEST }
        );
      }
    }

    const product = await productService.updateProduct(Number(id), productData, images);
    return NextResponse.json(
      { message: COMMON_CONSTANTS.SUCCESS, data: product },
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

export async function DELETE(request: NextRequest, { params }: Props) {
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const { id } = await params;
    await productService.deleteProduct(Number(id));
    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
