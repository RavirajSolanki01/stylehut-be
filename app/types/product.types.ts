export interface CreateProductDto {
  name: string;
  description: string;
  image?: string[];
  price: number;
  discount?: number;
  quantity: number;
  category_id: number;
  sub_category_id: number;
  sub_category_type_id: number;
  brand_id: number;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  id: number
}

export interface ProductResponse extends CreateProductDto {
  id: number;
  create_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}
