import { editCategoryPayload } from "./sub-category";

export interface addSubCategoryTypePayload extends editCategoryPayload {
  subCategoryId: number;
}

export interface getSubCategoryTypeParams {
  params: Promise<{ id: string }>;
}
