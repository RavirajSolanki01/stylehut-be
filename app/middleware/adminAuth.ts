import { NextRequest, NextResponse } from "next/server";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { errorResponse } from "@/app/utils/apiResponse";
import { userService } from "@/app/services/user.service";


export const checkAdminRole = async (req: NextRequest) => {
  const userRoleId = req.headers.get('x-user-role');
  if (!userRoleId) {
    return NextResponse.json(
      errorResponse("Unauthorized: Role ID is missing", HttpStatus.FORBIDDEN),
      { status: HttpStatus.FORBIDDEN }
    );
  }

  try {
    const role = await userService.getRoleById(parseInt(userRoleId));
    if (!role || role.name !== 'Admin') {
      return NextResponse.json(
        errorResponse("Unauthorized: Admin access required", HttpStatus.FORBIDDEN),
        { status: HttpStatus.FORBIDDEN }
      );
    }
  } catch (error) {
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
  return false;
};
