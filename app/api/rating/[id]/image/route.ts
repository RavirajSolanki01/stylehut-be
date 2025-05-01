import { NextRequest, NextResponse } from "next/server";
import { ratingService } from "@/app/services/rating.service";
import { errorResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { z } from "zod";

const imageRemoveSchema = z.object({
  imageUrls: z.array(z.string().url("Invalid Image URL")).min(1, "At least one image URL is required"),
});

type Props = {
  params: Promise<{ id: string }>;
};

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
    const body = await request.json();
    const validation = await imageRemoveSchema.parseAsync(body);
    
    await ratingService.removeRatingImages(Number(id), Number(userId), validation.imageUrls);
    
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
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}