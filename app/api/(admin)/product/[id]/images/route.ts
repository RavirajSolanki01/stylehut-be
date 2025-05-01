import { NextRequest, NextResponse } from "next/server";
import { productService } from "@/app/services/product.service";
import { errorResponse } from "@/app/utils/apiResponse";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { checkAdminRole } from "@/app/middleware/adminAuth";
import { z } from "zod";

type Props = {
  params: Promise<{ id: string }>;
};

const imageRemoveSchema = z.object({
  imageUrls: z.array(z.string().url("Invalid Image URL")).min(1, "At least one image URL is required"),
});

export async function DELETE(request: NextRequest, { params }: Props) {
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validation = await imageRemoveSchema.parseAsync(body);
    
    await productService.removeProductImages(Number(id), validation.imageUrls);
    
    return NextResponse.json(
      { message: COMMON_CONSTANTS.SUCCESS },
      { status: HttpStatus.OK }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse(error.errors[0].message, HttpStatus.BAD_REQUEST, error.errors),
        { status: HttpStatus.BAD_REQUEST }
      );
    }
    console.error("Remove product images error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}