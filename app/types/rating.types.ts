import { Decimal } from "decimal.js";

export interface RatingDto {
  id: number;
  user_id: number;
  product_id: number;
  ratings: Decimal;
  images: string[];
  description: string;
  create_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}

import {
  products,
  category,
  sub_category,
  sub_category_type,
  brand,
  ratings,
  cart_items,
  wishlist,
} from "@prisma/client";

export interface RatingStats {
  averageRating: number;
  totalRatings: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ProductWithRelations extends products {
  sub_category_type: sub_category_type & {
    sub_category: sub_category & {
      category: category;
    };
  };
  brand: brand;
  ratings: ratings[];
  cart_items?: cart_items[];
  wishlist?: wishlist[];
}

export interface FormattedProduct
  extends Omit<ProductWithRelations, "ratings" | "cart_items" | "wishlist"> {
  ratingStats: RatingStats;
  isInCart?: boolean;
  isInWishlist?: boolean;
}

export interface ProductOrderBy {
  category?: { name: "asc" | "desc" };
  brand?: { name: "asc" | "desc" };
  sub_category?: { name: "asc" | "desc" };
  sub_category_type?: { name: "asc" | "desc" };
  [key: string]: { name: "asc" | "desc" } | "asc" | "desc" | undefined;
}

export interface ProductInclude {
  sub_category_type: {
    include: {
      sub_category: {
        include: {
          category: true;
        };
      };
    };
  };
  brand: boolean;
  ratings: {
    where: { is_deleted: boolean };
  };
  cart_items?: {
    where: {
      is_deleted: boolean;
      cart: {
        user_id: number;
        is_deleted: boolean;
      };
    };
  };
  wishlist?: {
    where: {
      user_id: number;
      is_deleted: boolean;
    };
  };
  size_quantities?: {
    include: {
      size_data: true;
    };
  };
}
