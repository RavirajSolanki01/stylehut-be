import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { errorResponse } from "../utils/apiResponse";
import { HttpStatus } from "../utils/enums/httpStatusCode";

type ValidationOptions = {
  type?: "json" | "formdata";
  numberFields?: string[];
  fileFields?: string[];
};

export const validateRequest = (schema: ZodSchema, options: ValidationOptions = {}) => {
  return async (data: any) => {
    try {
      const { type = "json", numberFields = [], fileFields = [] } = options;

      if (type === "formdata") {
        // Convert string numbers to actual numbers if needed
        if (numberFields.length > 0) {
          numberFields.forEach(field => {
            if (data[field]?.[0]) {
              data[field][0] = Number(data[field][0]);
            }
          });
        }

        if (Object.keys(data).length > 0) {
          Object.keys(data).forEach(key => {
            if (Array.isArray(data[key]) && !fileFields.includes(key)) {
              data[key] = data[key]?.[0];
            } else if (typeof data[key] === "string") {
              data[key] = data[key].trim();
            }
          });
        }
      } else {
        data = await data.json();
      }
      const validatedData = await schema.parseAsync(data);
      return { validatedData };
    } catch (error: any) {
      console.error("Validation error:", error);
      return NextResponse.json(
        errorResponse("Validation Error", HttpStatus.BAD_REQUEST, error.errors || error.message),
        { status: HttpStatus.BAD_REQUEST }
      );
    }
  };
};
