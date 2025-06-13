import { addSubCategoryTypePayload } from "@/app/types/sub-category-type";
import { CATEGORY_CONSTANTS, SUB_CATEGORY_CONSTANTS } from "../constants";
import { addCategoryValidation } from "./category";
import { idValidation } from "./common";

export function addEditSubCategoryTypeValidation(data: addSubCategoryTypePayload) {
  const categoryValidation = idValidation(data.categoryId, CATEGORY_CONSTANTS.ID_VALIDATION);
  if (!categoryValidation.valid) {
    return categoryValidation;
  }

  const subCategoryValidation = idValidation(
    data.subCategoryId,
    SUB_CATEGORY_CONSTANTS.ID_VALIDATION
  );
  if (!subCategoryValidation.valid) {
    return subCategoryValidation;
  }

  const categoryDataValidation = addCategoryValidation(data);
  if (!categoryDataValidation.valid) {
    return categoryDataValidation;
  }

  return { valid: true };
}
