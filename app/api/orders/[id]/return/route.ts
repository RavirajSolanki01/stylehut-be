import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/app/services/order.service";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { validateRequest } from "@/app/middleware/validateRequest";
import { createReturnRequestSchema } from "@/app/utils/validationSchema/order.validation";
import { parseForm } from "@/app/utils/helper/formDataParser";
import { ReturnReason } from '@prisma/client';
type Props = {
  params: { id: string };
};

export async function POST(request: NextRequest, { params }: Props) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      errorResponse("Unauthorized", HttpStatus.UNAUTHORIZED),
      { status: HttpStatus.UNAUTHORIZED }
    );
  }

  try {
    // Validate content type
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        errorResponse("Invalid content type. Expected multipart/form-data", HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // Parse form data with proper error handling
    let fields, files;
    try {
      const formData = await parseForm(request);
      fields = formData.fields;
      files = formData.files;
    } catch (formError: any) {
      // Handle form parsing errors
      if (formError.message.includes("maxFileSize")) {
        return NextResponse.json(
          errorResponse("File size exceeds the 15MB limit", HttpStatus.BAD_REQUEST),
          { status: HttpStatus.BAD_REQUEST }
        );
      } else if (formError.message.includes("filter")) {
        return NextResponse.json(
          errorResponse("Only image files are allowed", HttpStatus.BAD_REQUEST),
          { status: HttpStatus.BAD_REQUEST }
        );
      }
      throw formError; // Re-throw for general error handling
    }

    const validation = await validateRequest(createReturnRequestSchema, {
      type: 'formdata',
      numberFields: [],
      fileFields: ['images']
    })({...fields, ...files});
    if ('status' in validation) {
      return validation;
    }

    const reason: ReturnReason = fields.reason?.[0]?.trim() as ReturnReason || '';
    const description = fields.description?.[0]?.trim() || '';
    
    // Validate images
    const images = Array.isArray(files.images) 
     ? files.images 
     : files.images ? [files.images] : [];

     // Check image types
    const invalidImages = images.filter(img => !img.mimetype?.startsWith('image/'));
    if (invalidImages.length > 0) {
      return NextResponse.json(
        errorResponse("Only image files are allowed", HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const { id } = await params;
    const returnRequest = await orderService.createReturnRequest(
      Number(userId),
      Number(id),
      { reason, description },
      images
    );

    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, returnRequest),
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    console.error("Create return request error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Internal Server Error", 
        error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR),
      { status: error.message ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}