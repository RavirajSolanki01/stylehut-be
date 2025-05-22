export interface CreateShopByCategoryDto {
  name: string;
  minDiscount: number;
  maxDiscount?: number;
  sub_category_id: number;
  user_id: number;
}

export interface UpdateShopByCategoryDto extends Partial<CreateShopByCategoryDto> {}

export interface ShopByCategoryResponse extends CreateShopByCategoryDto {
  id: number;
  create_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}
