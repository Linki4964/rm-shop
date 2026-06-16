// src/types/cart.ts
import type { Product } from './product';

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

export interface CartResponse {
  items: CartItem[];
  total_items: number;
  total_quantity: number;
}

export interface AddToCartData {
  product_id: number;
  quantity: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

// 管理员购物车概览项
export interface AdminCartOverview {
    user_id: number;
    username: string;
    email: string;
    total_items: number;
    total_quantity: number;
}
  

export interface AdminCartOverviewResponse {
    items: AdminCartOverview[];
    total: number;
    page: number;
    size: number;
    pages: number;
}