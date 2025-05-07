export const COMMON_CONSTANTS = {
  SUCCESS: "Success",
  ID_REQUIRED: "ID is missing or incorrect",
};

export const CATEGORY_CONSTANTS = {
  NOT_EXISTS_OR_DELETED: "Category does not exist or has been deleted",
  NOT_EXISTS: "Category does not exist",
  DELETE_SUCCESS: "Category deleted successfully",
  UPDATE_SUCCESS: "Category update successfully",
  CREATE_SUCCESS: "Category create successfully",
  NAME_DESCRIPTION_VALIDATION: "Name or description are required",
  NAME_LENGTH_VALIDATION: "Name can be up to 40 characters only",
  DESCRIPTION_LENGTH_VALIDATION: "Description can be up to 1024 characters only",
  IN_USED: "This category is currently in use and cannot be deleted",
  ID_VALIDATION: "Category ID is missing or incorrect",
  SAME_NAME_ERROR: "You can't add a category with this name because a similar name already exists",
};

export const SUB_CATEGORY_CONSTANTS = {
  ID_VALIDATION: "Sub category ID is missing or incorrect",
  CREATE_SUCCESS: "Sub Category create successfully",
  NOT_EXISTS_OR_DELETED: "Sub category does not exist or has been deleted",
  NOT_EXISTS: "Sub category does not exist",
  UPDATE_SUCCESS: "Sub category update successfully",
  IN_USED: "This sub category is currently in use and cannot be deleted",
  DELETE_SUCCESS: "Sub category deleted successfully",
  SAME_NAME_ERROR:
    "You can't add a sub category with this name because a similar name already exists",
};

export const SUB_CATEGORY_TYPE_CONSTANTS = {
  ID_VALIDATION: "Sub category type ID is missing or incorrect",
  CREATE_SUCCESS: "Sub Category type create successfully",
  NOT_EXISTS_OR_DELETED: "Sub category type does not exist or has been deleted",
  NOT_EXISTS: "Sub category type does not exist",
  UPDATE_SUCCESS: "Sub category type update successfully",
  IN_USED: "This sub category type is currently in use and cannot be deleted",
  DELETE_SUCCESS: "Sub category type deleted successfully",
  SUB_CATEGORY_NOT_ASSOCIATED_WITH_CATEGORY:
    "Sub category is not associated with the selected category",
  SAME_NAME_ERROR:
    "You can't add a sub category type with this name because a similar name already exists",
};

export const USER_CONSTANTS = {
  FILE_SIZE: 2 * 1024 * 1024,
  ALLOWED_FILE: ["image/jpeg", "image/png"],
  NOT_EXISTS_OR_DELETED: "User does not exist or has been deleted",
  FAIL_TO_UPLOAD_IMAGE: "Failed to upload image",
  FILE_SIZE_VALIDATION_MSG: "File size should not exceed 2MB",
  FILE_TYPE_VALIDATION_MSG: "Only JPG and PNG files are allowed",
};
