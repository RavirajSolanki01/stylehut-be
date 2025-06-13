import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/app/services/order.service";
import { errorResponse, paginatedResponse } from "@/app/utils/apiResponse";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { orderQuerySchema } from "@/app/utils/validationSchema/order.validation";

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json(errorResponse("Unauthorized", HttpStatus.UNAUTHORIZED), {
      status: HttpStatus.UNAUTHORIZED,
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const validatedQuery = await orderQuerySchema.parseAsync({
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "10",
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "",
      payment_status: searchParams.get("payment_status") || "",
      startDate: searchParams.get("startDate") || "",
      endDate: searchParams.get("endDate") || "",
      sortBy: searchParams.get("sortBy") || "created_at",
      order: (searchParams.get("order") as "asc" | "desc") || "desc",
    });

    const { data, total } = await orderService.getAdminOrders(validatedQuery);

    return NextResponse.json(
      paginatedResponse(
        COMMON_CONSTANTS.SUCCESS,
        data,
        validatedQuery.page,
        validatedQuery.pageSize,
        total
      ),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
