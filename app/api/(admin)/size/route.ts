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
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("ids")?.split(",");
  
  if (!!query) {

    const idSizes = await sizeService.getSizesById(query as []);
    console.log(">><<MKMK", query);
  
    return NextResponse.json({
      message: "Fetched successfully from IDs",
      data: idSizes,
      status: HttpStatus.OK,
    });
  } else {

    return NextResponse.json({
      message: "Fetched successfully",
      data: sizes,
      status: HttpStatus.OK,
    });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids")?.split(",");
  // const body = await request.json();
  const deleteSize = await sizeService.deleteSizes(ids as []);
  return NextResponse.json({
    message: "Size deleted successfully",
    data: deleteSize,
    status: HttpStatus.OK,
  });
}
