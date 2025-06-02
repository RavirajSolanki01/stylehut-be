import { NextRequest, NextResponse } from "next/server";
import { sizeService } from "@/app/services/size.service";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";

export async function POST(request: NextRequest) {
  const sizes = await request.json();

  const createdSizes = await sizeService.createSizes(sizes);
  return NextResponse.json({ message: createdSizes, data: [], status: HttpStatus.OK });
}

export async function GET(request: NextRequest) {
  const sizes = await sizeService.getAllSizes();
  return NextResponse.json(sizes);
}
