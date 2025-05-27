import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/app/services/user.service";
import { errorResponse, paginatedResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters with defaults
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const sortBy = searchParams.get("sortBy") || "create_at";
    const order = (searchParams.get("order") as "asc" | "desc") || "desc";
    
    // Additional filters
    const roleId = searchParams.get("roleId") 
      ? parseInt(searchParams.get("roleId")!) 
      : undefined;
    const genderId = searchParams.get("genderId") 
      ? parseInt(searchParams.get("genderId")!) 
      : undefined;

    const skip = (page - 1) * pageSize;
    
    const { data, total } = await userService.getAllUsers(
      skip,
      pageSize,
      search,
      sortBy,
      order,
      roleId,
      genderId,
      role
    );

    return NextResponse.json(
      paginatedResponse(COMMON_CONSTANTS.SUCCESS, data, page, pageSize, total),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}