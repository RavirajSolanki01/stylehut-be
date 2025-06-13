export interface ProductAdditionalDetailDto {
  id: number;
  value: string;
}

export interface ProductSpecificationDto {
  id: number;
  value: string;
}

export interface CreateProductDto {
  name: string;
  description: string;
  image?: string[];
  price: number;
  discount?: number;
  category_id: number;
  sub_category_id: number;
  sub_category_type_id: number;
  brand_id: number;
  size_quantity_id?: number;
  custom_product_id?: string;
  is_main_product?: boolean;
  variant_id?: string;
  product_additional_details?: ProductAdditionalDetailDto[];
  product_specifications?: ProductSpecificationDto[];
}

export interface UpdateProductDto extends Partial<Omit<CreateProductDto, 'product_additional_details' | 'product_specifications'>> {
  product_additional_details?: ProductAdditionalDetailDto[];
  product_specifications?: ProductSpecificationDto[];
}

export interface ProductResponse extends CreateProductDto {
  id: number;
  create_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}

export interface CreateProductAdditionalDetailDto {
  product_article_attributes: {
    key: string;
    value: string;
  }[];
  product_details: {
    title: string;
    description: string;
    type?: string;
    content?: string;
  }[];
}

export interface UpdateProductAdditionalDetailDto {
  product_article_attributes: {
    id?: number;
    key: string;
    value: string;
  }[];
  product_details: {
    id?: number;
    title: string;
    description: string;
    type?: string;
    content?: string;
  }[];
}
