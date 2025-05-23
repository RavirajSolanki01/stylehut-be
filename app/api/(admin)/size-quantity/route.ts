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

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  const isBatch = Array.isArray(body);

  if (!isBatch) {
    // Handle single update
    const { id, quantity, product_id, variant_id, size_id, custom_product_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
    }

    const updatedSize = await sizeQuantityService.updateSizeQuantities([
      {
        id,
        quantity,
        product_id,
        variant_id,
        size_id,
        custom_product_id,
      },
    ]);

    return NextResponse.json(updatedSize);
  } else {
    // Handle multiple updates
    const invalidItems = body.filter((item: any) => !item.id);
    if (invalidItems.length > 0) {
      return NextResponse.json({ error: 'Each item must have an ID for update' }, { status: 400 });
    }

    const updatedSizes = await sizeQuantityService.updateSizeQuantities(body);
    return NextResponse.json(updatedSizes);
  }
}


export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customProductId = searchParams.get("custom_product_id");

  if (!customProductId) {
    return NextResponse.json({ error: "custom_product_id is required" }, { status: 400 });
  }

  try {
    const result = await sizeQuantityService.deleteByCustomProductId(customProductId);
    return NextResponse.json({
      message: `Deleted ${result.count} size_quantity records for custom_product_id: ${customProductId}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const sizes = await sizeQuantityService.getAllSizeQuantities();
  return NextResponse.json(sizes);
}

