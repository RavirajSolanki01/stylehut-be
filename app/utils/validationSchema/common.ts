export function idValidation(id: number, validationMessage: string) {
  if (!id || id <= 0) {
    return { valid: false, message: validationMessage };
  }
  return { valid: true };
}
