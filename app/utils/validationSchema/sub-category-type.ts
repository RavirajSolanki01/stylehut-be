import { addSubCategoryTypePayload } from "@/app/types/sub-category-type";
import { SUB_CATEGORY_CONSTANTS } from "../constants";
import { idValidation } from "./common";

export function addEditSubCategoryTypeValidation(data: addSubCategoryTypePayload) {
  const subCategoryValidation = idValidation(
    data.subCategoryId,
    SUB_CATEGORY_CONSTANTS.ID_VALIDATION
  );
  if (!subCategoryValidation.valid) {
    return subCategoryValidation;
  }

  return { valid: true };
}
