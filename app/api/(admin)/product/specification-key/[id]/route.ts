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
        errorResponse("Product specification key id is required", HttpStatus.BAD_REQUEST),
        {
          status: HttpStatus.BAD_REQUEST,
        }
      );
    }
    const data = await productService.getSingleProductSpecificationKey(Number(id));
    if (!data) {
      return NextResponse.json(
        errorResponse("Product specification key not found", HttpStatus.NOT_FOUND),
        {
          status: HttpStatus.NOT_FOUND,
        }
      );
    }
    return NextResponse.json(
      successResponse("Product specification key fetched successfully", data),
      {
        status: HttpStatus.OK,
      }
    );
  } catch (error) {
    console.error("Get product specification key error:", error);
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
        errorResponse("Product specification key id is required", HttpStatus.BAD_REQUEST),
        {
          status: HttpStatus.BAD_REQUEST,
        }
      );
    }

    const checkAssociatedProduct =
      await productService.checkProductSpecificationAssociatedWithProduct(Number(id));
    if (checkAssociatedProduct) {
      return NextResponse.json(
        errorResponse(
          "Product specification key is associated with product",
          HttpStatus.BAD_REQUEST
        ),
        {
          status: HttpStatus.BAD_REQUEST,
        }
      );
    }

    await productService.deleteProductSpecificationKey(Number(id));
    return NextResponse.json(successResponse("Product specification key deleted successfully"), {
      status: HttpStatus.OK,
    });
  } catch (error) {
    console.error("Delete product specification key error:", error);
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
        errorResponse("Product specification key id is required", HttpStatus.BAD_REQUEST),
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

    const checkRecordPresent = await productService.getSingleProductSpecificationKey(Number(id));
    if (!checkRecordPresent) {
      return NextResponse.json(
        errorResponse("Product specification key not found", HttpStatus.NOT_FOUND),
        {
          status: HttpStatus.NOT_FOUND,
        }
      );
    }

    const checkNameIsPresent = await productService.checkProductSpecificationKeyPresentWithId(
      body.name,
      Number(id)
    );
    if (checkNameIsPresent) {
      return NextResponse.json(
        errorResponse("Specification key already exists", HttpStatus.BAD_REQUEST),
        {
          status: HttpStatus.BAD_REQUEST,
        }
      );
    }

    const result = await productService.updateProductSpecificationKey(Number(id), body);
    return NextResponse.json(
      successResponse("Product specification key updated successfully", result),
      {
        status: HttpStatus.OK,
      }
    );
  } catch (error) {
    console.error("Update product specification key error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
};
