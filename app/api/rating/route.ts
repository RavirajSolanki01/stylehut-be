import { NextRequest, NextResponse } from "next/server";
import { ratingService } from "@/app/services/rating.service";
import { createRatingSchema } from "@/app/utils/validationSchema/rating.validation";
import { validateRequest } from "@/app/middleware/validateRequest";
import { errorResponse, successResponse, paginatedResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { parseForm } from "@/app/utils/helper/formDataParser";
import { z } from "zod";

export async function POST(request: NextRequest) {
  // Get user ID from auth header
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
    
    // Validate request data
    const validation = await validateRequest(createRatingSchema, {
      type: 'formdata',
      numberFields: ['product_id', 'ratings'],
      fileFields: ['images']
    })({...fields, ...files});
    if ('status' in validation) {
      return validation;
    }

    // Additional validation for product_id and ratings
    const productId = parseInt(fields.product_id?.[0] || '0');
    const ratings = parseInt(fields.ratings?.[0] || '0');
    const description = fields.description?.[0]?.trim() || '';

    if (isNaN(productId) || productId <= 0) {
      return NextResponse.json(
        errorResponse("Invalid product_id", HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    if (isNaN(ratings) || ratings < 1 || ratings > 5) {
      return NextResponse.json(
        errorResponse("Ratings must be between 1 and 5", HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // Validate description length
    if (description.length < 10) {
      return NextResponse.json(
        errorResponse("Description must be at least 10 characters", HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    if (description.length > 100) {
      return NextResponse.json(
        errorResponse("Description must not exceed 100 characters", HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

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

    // Prepare rating data
    const ratingData = {
      product_id: productId,
      ratings: ratings,
      description: description,
    };

    // Check if product exists (assuming we need to add this validation)
    try {
      // Create the rating
      const rating = await ratingService.createRating(
        Number(userId), 
        ratingData, 
        images
      );
      
      return NextResponse.json(
        successResponse(COMMON_CONSTANTS.SUCCESS, rating),
        { status: HttpStatus.OK }
      );
    } catch (serviceError: any) {
      // Handle specific service errors
      if (serviceError.message?.includes('product') && serviceError.message?.includes('not found')) {
        return NextResponse.json(
          errorResponse("Product not found", HttpStatus.NOT_FOUND),
          { status: HttpStatus.NOT_FOUND }
        );
      }
      throw serviceError; // Re-throw for general error handling
    }
  } catch (error: any) {
    console.error("Rating creation error:", error);
    
    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse(error.errors[0].message, HttpStatus.BAD_REQUEST, error.errors),
        { status: HttpStatus.BAD_REQUEST }
      );
    }
    
    // Handle Prisma errors
    if (error.code) {
      switch (error.code) {
        case 'P2002': // Unique constraint violation
          return NextResponse.json(
            errorResponse("You have already rated this product", HttpStatus.CONFLICT),
            { status: HttpStatus.CONFLICT }
          );
        case 'P2003': // Foreign key constraint violation
          return NextResponse.json(
            errorResponse("Referenced product does not exist", HttpStatus.BAD_REQUEST),
            { status: HttpStatus.BAD_REQUEST }
          );
        case 'P2025': // Record not found
          return NextResponse.json(
            errorResponse("Product not found", HttpStatus.NOT_FOUND),
            { status: HttpStatus.NOT_FOUND }
          );
      }
    }
    
    // Handle file system errors
    if (error.code === 'ENOENT' || error.code === 'EACCES') {
      return NextResponse.json(
        errorResponse("File system error while processing images", HttpStatus.INTERNAL_SERVER_ERROR),
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      );
    }
    
    // Handle Cloudinary errors
    if (error.message?.includes('Cloudinary')) {
      return NextResponse.json(
        errorResponse("Error uploading images", HttpStatus.INTERNAL_SERVER_ERROR),
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      );
    }
    
    // Generic error response
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = {
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "10"),
      product_id: searchParams.get("product_id") 
        ? parseInt(searchParams.get("product_id")!) 
        : undefined,
      user_id: searchParams.get("user_id") 
        ? parseInt(searchParams.get("user_id")!) 
        : undefined,
      minRating: searchParams.get("minRating") 
        ? parseInt(searchParams.get("minRating")!) 
        : undefined,
      maxRating: searchParams.get("maxRating") 
        ? parseInt(searchParams.get("maxRating")!) 
        : undefined,
      sortBy: (searchParams.get("sortBy") as "ratings" | "description" | "create_at") || "create_at",
      order: (searchParams.get("order") as "asc" | "desc") || "desc",
      search: (searchParams.get("search")) || "",
    };
    const { data, total } = await ratingService.getAllRatings(params);

    return NextResponse.json(
      paginatedResponse(
        COMMON_CONSTANTS.SUCCESS, 
        data, 
        params.page, 
        params.pageSize, 
        total
      ),
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