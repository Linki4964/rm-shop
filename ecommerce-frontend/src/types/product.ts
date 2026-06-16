// src/types/product.ts
export interface Product {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    image_url: string | null;
    category: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface ProductCreate {
    name: string;
    description?: string | null;
    price: number;
    stock?: number;
    image_url?: string | null;
    category?: string | null;
    is_active?: boolean;
  }
  
  export interface ProductUpdate {
    name?: string;
    description?: string | null;
    price?: number;
    stock?: number;
    image_url?: string | null;
    category?: string | null;
    is_active?: boolean;
  }
  
  export interface ProductListResponse {
    items: Product[];
    total: number;
    page: number;
    size: number;
    pages: number;
  }
  
  export interface ProductSearchParams {
    page?: number;
    size?: number;
    keyword?: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    is_active?: boolean;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }