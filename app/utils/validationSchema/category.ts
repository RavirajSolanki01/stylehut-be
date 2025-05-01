import { addCategoryPayload } from "@/app/types/category";
import { CATEGORY_CONSTANTS, COMMON_CONSTANTS } from "../constants";
import { z } from "zod";

export function addCategoryValidation(data: addCategoryPayload) {
  const { name, description } = data;

  if (!name.trim() || !description.trim()) {
    return { valid: false, message: CATEGORY_CONSTANTS.NAME_DESCRIPTION_VALIDATION };
  }

  if (name.length > 30) {
    return { valid: false, message: CATEGORY_CONSTANTS.NAME_LENGTH_VALIDATION };
  }

  if (description.length > 100) {
    return {
      valid: false,
      message: CATEGORY_CONSTANTS.DESCRIPTION_LENGTH_VALIDATION,
    };
  }

  return { valid: true };
}

export function categoryIdValidation(id: number) {
  if (id <= 0 || !id) {
    return { valid: false, message: COMMON_CONSTANTS.ID_REQUIRED };
  }
  return { valid: true };
}

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: CATEGORY_CONSTANTS.NAME_DESCRIPTION_VALIDATION })
    .max(30, { message: CATEGORY_CONSTANTS.NAME_LENGTH_VALIDATION }),
  description: z
    .string()
    .trim()
    .min(1, { message: CATEGORY_CONSTANTS.NAME_DESCRIPTION_VALIDATION })
    .max(100, { message: CATEGORY_CONSTANTS.DESCRIPTION_LENGTH_VALIDATION }),
});

export const categoryIdSchema = z
  .number()
  .int()
  .positive({ message: COMMON_CONSTANTS.ID_REQUIRED });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type IdInput = z.infer<typeof categoryIdSchema>;
