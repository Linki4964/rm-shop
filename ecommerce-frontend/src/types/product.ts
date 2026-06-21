export interface ProductFeature {
  icon: string;
  title: string;
  desc: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  category: string | null;
  is_active: boolean;
  features?: ProductFeature[] | null;
  avg_rating?: number;
  review_count?: number;
  sales_count?: number;
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
  features?: ProductFeature[] | null;
}

export interface ProductUpdate {
  name?: string;
  description?: string | null;
  price?: number;
  stock?: number;
  image_url?: string | null;
  category?: string | null;
  is_active?: boolean;
  features?: ProductFeature[] | null;
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
  in_stock?: boolean;
  is_active?: boolean;
  sort_by?: 'created_at' | 'price' | 'stock' | 'sales_count' | 'avg_rating';
  sort_order?: 'asc' | 'desc';
}
