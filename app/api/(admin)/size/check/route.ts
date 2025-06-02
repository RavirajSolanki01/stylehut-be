import { NextRequest, NextResponse } from "next/server";
import { sizeService } from "@/app/services/size.service";

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: "Size name is required" },
        { status: 400 }
      );
    }

    const result = await sizeService.checkSizeNameExists(name);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check size name" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const result = await sizeService.searchSizes(query);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to search sizes" },
      { status: 500 }
    );
  }
} 