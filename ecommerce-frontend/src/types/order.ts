// src/types/order.ts
export interface OrderItem {
    id: number;
    product_id: number | null;
    product_name: string | null;
    quantity: number;
    price: number;
    product?: {
      id: number;
      name: string;
      image_url: string | null;
    } | null;
  }
  
  export interface Order {
    id: number;
    order_number: string;
    total_amount: number;
    status: string;
    shipping_address: string;
    created_at: string;
    updated_at: string;
    items: OrderItem[];
  }
  
  export interface OrderCreate {
    shipping_address: string;
  }
  
  export interface OrderListResponse {
    items: Order[];
    total: number;
  }

  export interface AdminOrder extends Order {
    user?: {
      id: number;
      username: string;
      email: string;
    };
  }
  
  export interface AdminOrderListResponse {
    items: AdminOrder[];
    total: number;
  }