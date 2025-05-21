import { NextRequest, NextResponse } from "next/server";
import { sizeQuantityService } from "@/app/services/sizequantity.service";
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Check if the input is an array
  const isBatch = Array.isArray(body);

  if (!isBatch) {
    // Handle single entry
    const { quantity, product_id, variant_id, size_id, custom_product_id } = body;

    const createdSize = await sizeQuantityService.createSizeQuantities([{
      quantity,
      product_id,
      variant_id,
      size_id,
      custom_product_id,
    }]);

    return NextResponse.json(createdSize);
  } else {
    // Handle multiple entries
    const createdSizes = await sizeQuantityService.createSizeQuantities(body);
    return NextResponse.json(createdSizes);
  }
}

export async function GET(request: NextRequest) {
  const sizes = await sizeQuantityService.getAllSizeQuantities();
  return NextResponse.json(sizes);
}

