import { NextRequest, NextResponse } from "next/server";
import { sizeService } from "@/app/services/size.service";
export async function POST(request: NextRequest) {
  const { name, size: sizeValue } = await request.json();
  const createdSize = await sizeService.createSize({
    name,
    size: sizeValue,
  });
  return NextResponse.json(createdSize);
}
export async function GET(request: NextRequest) {
  const sizes = await sizeService.getAllSizes();
  return NextResponse.json(sizes);
}

