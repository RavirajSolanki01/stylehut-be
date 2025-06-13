import { NextRequest, NextResponse } from "next/server";
import { productService } from "@/app/services/product.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { validateRequest } from "@/app/middleware/validateRequest";
import { productAdditionalKeySchema } from "@/app/utils/validationSchema/product.validation";

export const GET = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    if (!Number(id)) {
      return NextResponse.json(
        errorResponse("Product additional details key id is required", HttpStatus.BAD_REQUEST),
        {
          status: HttpStatus.BAD_REQUEST,
        }
      );
    }
    const data = await productService.getSingleProductAdditionalKey(Number(id));
    if (!data) {
      return NextResponse.json(
        errorResponse("Product additional details key not found", HttpStatus.NOT_FOUND),
        {
          status: HttpStatus.NOT_FOUND,
        }
      );
    }
    return NextResponse.json(
      successResponse("Product additional details key fetched successfully", data),
      {
        status: HttpStatus.OK,
      }
    );
  } catch (error) {
    console.error("Get product additional details key error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
};

export const DELETE = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    if (!Number(id)) {
      return NextResponse.json(
        errorResponse("Product additional details key id is required", HttpStatus.BAD_REQUEST),
        {
          status: HttpStatus.BAD_REQUEST,
        }
      );
    }

    const checkAssociatedProduct =
      await productService.checkProductAdditionalKeyAssociatedWithProduct(Number(id));
    if (checkAssociatedProduct) {
      return NextResponse.json(
        errorResponse(
          "Product additional details key is associated with product",
          HttpStatus.BAD_REQUEST
        ),
        {
          status: HttpStatus.BAD_REQUEST,
        }
      );
    }

    await productService.deleteProductAdditionalKey(Number(id));
    return NextResponse.json(
      successResponse("Product additional details key deleted successfully"),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("Delete product additional details key error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
};

export const PATCH = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    if (!Number(id)) {
      return NextResponse.json(
        errorResponse("Product additional details key id is required", HttpStatus.BAD_REQUEST),
        {
          status: HttpStatus.BAD_REQUEST,
        }
      );
    }
    const validation = await validateRequest(productAdditionalKeySchema)(req);
    if ("status" in validation) {
      return validation;
    }
    const { validatedData: body } = validation;

    const checkRecordPresent = await productService.getSingleProductAdditionalKey(Number(id));
    if (!checkRecordPresent) {
      return NextResponse.json(
        errorResponse("Product additional details key not found", HttpStatus.NOT_FOUND),
        {
          status: HttpStatus.NOT_FOUND,
        }
      );
    }

    const checkNameIsPresent = await productService.checkProductAdditionalKeyPresentWithId(
      body.name,
      Number(id)
    );
    if (checkNameIsPresent) {
      return NextResponse.json(
        errorResponse("Additional details key already exists", HttpStatus.BAD_REQUEST),
        {
          status: HttpStatus.BAD_REQUEST,
        }
      );
    }

    const result = await productService.updateProductAdditionalKey(Number(id), body);
    return NextResponse.json(
      successResponse("Product additional details key updated successfully", result),
      {
        status: HttpStatus.OK,
      }
    );
  } catch (error) {
    console.error("Update product additional details key error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
};
