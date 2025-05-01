import { CATEGORY_CONSTANTS } from "../constants";
import { editCategoryPayload } from "@/app/types/sub-category";
import { addCategoryValidation } from "./category";
import { idValidation } from "./common";

export function addEditSubCategoryValidation(data: editCategoryPayload) {
  const categoryValidation = idValidation(data.categoryId, CATEGORY_CONSTANTS.ID_VALIDATION);
  if (!categoryValidation.valid) {
    return categoryValidation;
  }

  const categoryDataValidation = addCategoryValidation(data);
  if (!categoryDataValidation.valid) {
    return categoryDataValidation;
  }

  return { valid: true };
}
