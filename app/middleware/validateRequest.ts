import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { errorResponse } from "../utils/apiResponse";
import { HttpStatus } from "../utils/enums/httpStatusCode";

type ValidationOptions = {
  type?: "json" | "formdata";
  numberFields?: string[];
  fileFields?: string[];
  jsonFields?: string[];
};

export const validateRequest = (schema: ZodSchema, options: ValidationOptions = {}) => {
  return async (data: any) => {
    try {
      const { type = "json", numberFields = [], fileFields = [], jsonFields = [] } = options;

      if (type === "formdata") {
        // First handle file fields to ensure they're not modified
        const fileData: Record<string, any> = {};
        fileFields.forEach(field => {
          if (data[field]) {
            fileData[field] = data[field];
          }
        });

        // Convert string numbers to actual numbers if needed
        if (numberFields.length > 0) {
          numberFields.forEach(field => {
            if (data[field]?.[0] && !fileFields.includes(field)) {
              data[field][0] = Number(data[field][0]);
            }
          });
        }

        // Parse JSON fields if they contain JSON strings
        if (jsonFields.length > 0) {
          jsonFields.forEach(field => {
            if (data[field]?.[0] && isJsonString(data[field][0]) && !fileFields.includes(field)) {
              data[field][0] = JSON.parse(data[field][0]);
            }
          });
        }

        if (Object.keys(data).length > 0) {
          Object.keys(data).forEach(key => {
            if (Array.isArray(data[key]) && !fileFields.includes(key)) {
              data[key] = data[key]?.[0];
            } else if (typeof data[key] === "string" && !fileFields.includes(key)) {
              data[key] = data[key].trim();
              // Check if it's a JSON string for non-file fields
              if (jsonFields.includes(key) && isJsonString(data[key])) {
                data[key] = JSON.parse(data[key]);
              }
            }
          });
        }

        // Restore file fields to their original values
        Object.assign(data, fileData);
      } else {
        data = await data.json();
        // Parse JSON fields for JSON requests
        if (jsonFields.length > 0) {
          jsonFields.forEach(field => {
            if (data[field] && typeof data[field] === "string" && isJsonString(data[field])) {
              data[field] = JSON.parse(data[field]);
            }
          });
        }
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

// Helper function to check if a string is valid JSON
function isJsonString(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}
