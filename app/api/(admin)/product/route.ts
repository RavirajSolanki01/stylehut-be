import { NextRequest, NextResponse } from "next/server";
import { productService } from "@/app/services/product.service";
import { errorResponse, successResponse, paginatedResponse } from "@/app/utils/apiResponse";
import { categoryService } from "@/app/services/category.service";
import { subCategoryService } from "@/app/services/subCategory.service";
import { subCategoryTypeService } from "@/app/services/subCategoryType.service";
import { brandService } from "@/app/services/brand.service";
import { COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { parseForm } from "@/app/utils/helper/formDataParser";
import {
  createProductSchema,
  productQuerySchema,
} from "@/app/utils/validationSchema/product.validation";
import { checkAdminRole } from "@/app/middleware/adminAuth";
import { validateRequest } from "@/app/middleware/validateRequest";
import { FormattedProduct } from "@/app/types/rating.types";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
// Configure Next.js to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  const authResponse = await checkAdminRole(request);
  if (authResponse) return authResponse;

  try {
    // const formData = await request.formData();
    const { fields, files } = await parseForm(request);

    const validation = await validateRequest(createProductSchema, {
      type: "formdata",
      numberFields: [
        "price",
        "discount",
        "category_id",
        "sub_category_id",
        "sub_category_type_id",
        "brand_id",
      ],
      fileFields: ["images"],
      jsonFields: ["product_additional_details", "product_specifications"],
    })({ ...fields, ...files });
    if ("status" in validation) {
      return validation;
    }

    // Validate category_id
    if (!(await categoryService.exists(fields.category_id?.[0]))) {
      return NextResponse.json(errorResponse("Invalid category_id", HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    // Validate sub_category_id
    if (!(await subCategoryService.exists(fields.sub_category_id?.[0]))) {
      return NextResponse.json(errorResponse("Invalid sub_category_id", HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    // Validate sub_category_type_id
    if (!(await subCategoryTypeService.exists(fields.sub_category_type_id?.[0]))) {
      return NextResponse.json(
        errorResponse("Invalid sub_category_type_id", HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // Validate brand_id
    if (!(await brandService.exists(fields.brand_id?.[0]))) {
      return NextResponse.json(errorResponse("Invalid brand_id", HttpStatus.BAD_REQUEST), {
        status: HttpStatus.BAD_REQUEST,
      });
    }
    const productData = {
      name: fields.name?.[0] || "",
      description: fields.description?.[0] || "",
      price: parseFloat(fields.price?.[0] || "0"),
      discount: parseInt(fields.discount?.[0] || "0"),
      category_id: parseInt(fields.category_id?.[0] || "0"),
      sub_category_id: parseInt(fields.sub_category_id?.[0] || "0"),
      sub_category_type_id: parseInt(fields.sub_category_type_id?.[0] || "0"),
      brand_id: parseInt(fields.brand_id?.[0] || "0"),
      size_quantity_id: parseInt(fields.size_quantity_id?.[0] || "0"),
      custom_product_id: fields.custom_product_id?.[0] || "",
      variant_id: fields.variant_id?.[0] || "",
      is_main_product: fields.is_main_product?.[0] === "true",

      product_additional_details: fields.product_additional_details
        ? (() => {
            let details = fields.product_additional_details;
            if (typeof details === "string") {
              details = JSON.parse(details);
            }
            if (Array.isArray(details) && details.length === 1 && Array.isArray(details[0])) {
              details = details[0];
            }
            if (!Array.isArray(details)) return [];

            return details.map((item: any) => ({
              id: Number(item.id),
              value: String(item.value),
            }));
          })()
        : [],

      product_specifications: fields.product_specifications
        ? (() => {
            let specs = fields.product_specifications;
            if (typeof specs === "string") {
              specs = JSON.parse(specs);
            }
            if (Array.isArray(specs) && specs.length === 1 && Array.isArray(specs[0])) {
              specs = specs[0];
            }
            if (!Array.isArray(specs)) return [];

            return specs.map((item: any) => ({
              id: Number(item.id),
              value: String(item.value),
            }));
          })()
        : [],
    };

    const images = Array.isArray(files.images) ? files.images : files.images ? [files.images] : [];
    if (
      productData.product_additional_details &&
      productData.product_additional_details.length > 0
    ) {
      const productAdditionalDetailIds = productData.product_additional_details.map(
        spec => spec.id
      );

      // Check if all specification keys exist and are not deleted
      const existingKeys = await prisma.product_additional_detail_key.findMany({
        where: {
          id: { in: productAdditionalDetailIds },
          is_deleted: false,
        },
        select: { id: true },
      });
      // Check if any specified key is missing
      const existingKeyIds = new Set(existingKeys.map(key => key.id));
      const missingKeys = productAdditionalDetailIds.filter(id => !existingKeyIds.has(id));

      if (missingKeys.length > 0) {
        return NextResponse.json(
          errorResponse(
            `Some additional detail keys are missing or deleted in product additional details: ${missingKeys.join(", ")}`,
            HttpStatus.BAD_REQUEST
          ),
          { status: HttpStatus.BAD_REQUEST }
        );
      }
    }

    if (productData.product_specifications && productData.product_specifications.length > 0) {
      const specificationKeyIds = productData.product_specifications.map(spec => spec.id);

      // Check if all specification keys exist and are not deleted
      const existingKeys = await prisma.product_specification_key.findMany({
        where: {
          id: { in: specificationKeyIds },
          is_deleted: false,
        },
        select: { id: true },
      });

      // Check if any specified key is missing
      const existingKeyIds = new Set(existingKeys.map(key => key.id));
      const missingKeys = specificationKeyIds.filter(id => !existingKeyIds.has(id));

      if (missingKeys.length > 0) {
        return NextResponse.json(
          errorResponse(
            `Some additional detail keys are missing or deleted in specification keys: ${missingKeys.join(", ")}`,
            HttpStatus.BAD_REQUEST
          ),
          { status: HttpStatus.BAD_REQUEST }
        );
      }
    }

    const product = await productService.createProduct(productData, images);

    return NextResponse.json(successResponse(COMMON_CONSTANTS.SUCCESS, product), {
      status: HttpStatus.OK,
    });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");

  try {
    const { searchParams } = new URL(request.url);

    const validatedQuery = await productQuerySchema.parseAsync({
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "10",
      search: searchParams.get("search") || "",
      sortBy: searchParams.get("sortBy") || "create_at",
      order: searchParams.get("order") || "desc",

      category_id: searchParams.get("category_id") || "0",
      sub_category_id: searchParams.get("sub_category_id") || "0",
      sub_category_type_id: searchParams.get("sub_category_type_id") || "0",
      brand_id: searchParams.get("brand_id") || "0",

      minPrice: searchParams.get("minPrice") || "0",
      maxPrice: searchParams.get("maxPrice") || "0",
      minDiscount: searchParams.get("minDiscount") || "0",
      maxDiscount: searchParams.get("maxDiscount") || "100",
    });

    const { data, total } = await productService.getAllProducts(validatedQuery, userId);

    return NextResponse.json(
      paginatedResponse(
        COMMON_CONSTANTS.SUCCESS,
        data as FormattedProduct[],
        validatedQuery.page,
        validatedQuery.pageSize,
        total
      ),
      { status: HttpStatus.OK }
    );
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json(
      errorResponse("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
