export interface CreateProductDto {
  name: string;
  description: string;
  image?: string[];
  price: number;
  discount?: number;
  // quantity: number;
  sub_category_type_id: number;
  brand_id: number;
  size_quantity_id?: number;
  custom_product_id?: string;
  is_main_product?: boolean;
  variant_id?: string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface ProductResponse extends CreateProductDto {
  id: number;
  create_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}
