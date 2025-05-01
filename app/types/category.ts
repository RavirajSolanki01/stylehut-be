export interface addCategoryPayload {
  name: string;
  description: string;
}

export interface listCategoryPayload {
  page?: string;
  pageSize?: string;
  search?: string;
  sortBy?: string;
  order?: string;
}

export interface getCategoryParams {
  params: Promise<{ id: string }>;
}
