export interface CreateBrandDto {
  name: string;
  description: string;
}

export interface UpdateBrandDto {
  name?: string;
  description?: string;
}

export interface BrandResponse {
  id: number;
  name: string;
  description: string;
  create_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}
