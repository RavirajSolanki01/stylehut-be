import { NextRequest, NextResponse } from "next/server";
import { ratingService } from "@/app/services/rating.service";
import { updateRatingSchema } from "@/app/utils/validationSchema/rating.validation";
import { validateRequest } from "@/app/middleware/validateRequest";
import { errorResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { parseForm } from "@/app/utils/helper/formDataParser";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const rating = await ratingService.getRatingById(Number(id));
    if (!rating) {
      return NextResponse.json(
        errorResponse("Rating not found", HttpStatus.NOT_FOUND),
        { status: HttpStatus.NOT_FOUND }
      );
    }
    return NextResponse.json(
      { message: COMMON_CONSTANTS.SUCCESS, data: rating },
      { status: HttpStatus.OK }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      errorResponse("Unauthorized", HttpStatus.UNAUTHORIZED),
      { status: HttpStatus.UNAUTHORIZED }
    );
  }

  try {
    const { id } = await params;
    const { fields, files } = await parseForm(request);

    const validation = await validateRequest(updateRatingSchema, {
      type: 'formdata',
      numberFields: ['product_id', 'ratings'],
      fileFields: ['images']
    })({...fields, ...files});
    if ('status' in validation) {
      return validation;
    }

    const ratingData = {
      // ...(fields.product_id?.[0] && { product_id: parseInt(fields.product_id[0]) }),
      ...(fields.ratings?.[0] && { ratings: parseInt(fields.ratings?.[0] || '0') }),
      ...(fields.description?.[0] && { description: fields.description[0] }),
    };

    const images = files.images ? (
      Array.isArray(files.images) ? files.images : [files.images]
    ) : undefined;

    const rating = await ratingService.updateRating(
      Number(id),
      Number(userId),
      ratingData, 
      images
    );
    
    return NextResponse.json(
      { message: COMMON_CONSTANTS.SUCCESS, data: rating },
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    if (error.message === 'Rating not found or unauthorized') {
      return NextResponse.json(
        errorResponse(error.message, HttpStatus.FORBIDDEN),
        { status: HttpStatus.FORBIDDEN }
      );
    }
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      errorResponse("Unauthorized", HttpStatus.UNAUTHORIZED),
      { status: HttpStatus.UNAUTHORIZED }
    );
  }

  try {
    const { id } = await params;
    await ratingService.deleteRating(Number(id), Number(userId));
    return NextResponse.json(
      { message: COMMON_CONSTANTS.SUCCESS },
      { status: HttpStatus.OK }
    );
  } catch (error: any) {
    if (error.message === 'Rating not found or unauthorized') {
      return NextResponse.json(
        errorResponse(error.message, HttpStatus.FORBIDDEN),
        { status: HttpStatus.FORBIDDEN }
      );
    }
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}