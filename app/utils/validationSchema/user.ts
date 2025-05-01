import formidable from "formidable";
import { USER_CONSTANTS } from "../constants";

export async function profileImgValidation(file: formidable.File) {
  if (file && file.mimetype) {
    if (file.size > USER_CONSTANTS.FILE_SIZE) {
      return { valid: false, message: USER_CONSTANTS.FILE_SIZE_VALIDATION_MSG };
    }

    const allowedTypes = USER_CONSTANTS.ALLOWED_FILE;
    if (!allowedTypes.includes(file.mimetype)) {
      return { valid: false, message: USER_CONSTANTS.FILE_TYPE_VALIDATION_MSG };
    }
  }
  return { valid: true };
}
