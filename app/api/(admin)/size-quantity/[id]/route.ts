import { sizeQuantityService } from "@/app/services/sizequantity.service";
import { NextRequest, NextResponse } from "next/server";
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