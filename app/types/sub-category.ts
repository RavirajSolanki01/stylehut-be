import { addCategoryPayload } from "./category";

export interface editCategoryPayload extends addCategoryPayload {
  categoryId: number;
}

export interface getSubCategoryParams {
  params: Promise<{ id: string }>;
}
