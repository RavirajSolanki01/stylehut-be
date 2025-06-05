// import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
// import { NextRequest, NextResponse } from "next/server";
// import { productService } from "@/app/services/product.service";
// import { errorResponse, successResponse } from "@/app/utils/apiResponse";
// import { COMMON_CONSTANTS } from "@/app/utils/constants";
// import { validateRequest } from "@/app/middleware/validateRequest";
// import {
//   productAdditionalCreateSchema,
//   productAdditionalUpdateSchema,
// } from "@/app/utils/validationSchema/product.validation";

// type Props = {
//   params: Promise<{ id: string }>;
// };

// export async function POST(request: NextRequest, { params }: Props) {
//   try {
//     const { id } = await params;

//     const product = await productService.getProductById(+id);
//     if (!product) {
//       return NextResponse.json(errorResponse("Product not found", HttpStatus.NOT_FOUND), {
//         status: HttpStatus.NOT_FOUND,
//       });
//     }

//     const validation = await validateRequest(productAdditionalCreateSchema)(request);

//     if ("status" in validation) {
//       return validation;
//     }

//     const { validatedData: body } = validation;

//     const result = await productService.createProductAdditionalDetail(+id, body);

//     return NextResponse.json(successResponse(COMMON_CONSTANTS.SUCCESS, result), {
//       status: HttpStatus.OK,
//     });
//   } catch (error) {
//     console.error("Get product error:", error);
//     return NextResponse.json(
//       errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
//       { status: HttpStatus.INTERNAL_SERVER_ERROR }
//     );
//   }
// }

// export async function PUT(request: NextRequest, { params }: Props) {
//   try {
//     const { id } = await params;

//     const product = await productService.getProductById(+id);
//     if (!product) {
//       return NextResponse.json(errorResponse("Product not found", HttpStatus.NOT_FOUND), {
//         status: HttpStatus.NOT_FOUND,
//       });
//     }

//     const validation = await validateRequest(productAdditionalUpdateSchema)(request);

//     if ("status" in validation) {
//       return validation;
//     }

//     const { validatedData: body } = validation;

//     const result = await productService.updateProductAdditionalDetail(+id, body);

//     return NextResponse.json(successResponse(COMMON_CONSTANTS.SUCCESS, result), {
//       status: HttpStatus.OK,
//     });
//   } catch (error) {
//     console.error("Get product error:", error);
//     return NextResponse.json(
//       errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
//       { status: HttpStatus.INTERNAL_SERVER_ERROR }
//     );
//   }
// }
