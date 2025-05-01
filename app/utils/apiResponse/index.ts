import { HttpStatus } from "../enums/httpStatusCode";

export function successResponse<T>(message: string, data: T = {} as T, token?: string) {
  return {
    status: HttpStatus.OK,
    success: true,
    message,
    data,
    token,
  };
}

export function errorResponse<T>(message: string, statusCode: number, data: T = {} as T) {
  return {
    status: statusCode,
    success: false,
    message,
    data,
  };
}

export function paginatedResponse<T>(
  message: string,
  items: T[],
  page: number,
  pageSize: number,
  total: number
) {
  return successResponse(message, {
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
