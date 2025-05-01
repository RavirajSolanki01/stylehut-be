import { NextRequest, NextResponse } from "next/server";
import { productService } from "@/app/services/product.service";
import { errorResponse } from "@/app/utils/apiResponse";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";

import { parseForm } from "@/app/utils/helper/formDataParser";
import { updateProductSchema } from "@/app/utils/validationSchema/product.validation";
import { checkAdminRole } from "@/app/middleware/adminAuth";
import { validateRequest } from "@/app/middleware/validateRequest";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const product = await productService.getProductById(Number(id));
    if (!product) {
      return NextResponse.json(
        errorResponse("Product not found", HttpStatus.NOT_FOUND),
        { status: HttpStatus.NOT_FOUND }
      );
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
      type: 'formdata',
      numberFields: ['price', 'discount', 'quantity', 'category_id', 'sub_category_id', 'sub_category_type_id', 'brand_id'],
      fileFields: ['images']
    })({...fields, ...files});
    if ('status' in validation) {
      return validation;
    }

    const productData = {
      ...(fields.name?.[0] && { name: fields.name[0] }),
      ...(fields.description?.[0] && { description: fields.description[0] }),
      ...(fields.price?.[0] && { price: parseFloat(fields.price[0]) }),
      ...(fields.discount?.[0] && { discount: parseInt(fields.discount[0]) }),
      ...(fields.quantity?.[0] && { quantity: parseInt(fields.quantity[0]) }),
      ...(fields.category_id?.[0] && { category_id: parseInt(fields.category_id[0]) }),
      ...(fields.sub_category_id?.[0] && { sub_category_id: parseInt(fields.sub_category_id[0]) }),
      ...(fields.sub_category_type_id?.[0] && { sub_category_type_id: parseInt(fields.sub_category_type_id[0]) }),
      ...(fields.brand_id?.[0] && { brand_id: parseInt(fields.brand_id[0]) }),
    };

    // Convert files to array if new images are uploaded
    const images = files.images ? (
      Array.isArray(files.images) ? files.images : [files.images]
    ) : undefined;

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