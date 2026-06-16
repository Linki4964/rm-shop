// src/types/user.ts

export interface User {
    id: number;
    email: string;
    username: string;
    full_name: string | null;
    is_active: boolean;
    is_superuser: boolean;
    created_at: string;
  }
  
  export interface UserCreate {
    email: string;
    username: string;
    password: string;
    full_name?: string | null;
    is_superuser?: boolean;
    is_active?: boolean;
  }
  
  export interface UserUpdate {
    email?: string;
    username?: string;
    password?: string;
    full_name?: string | null;
    is_superuser?: boolean;
    is_active?: boolean;
  }
  
  export interface UserListResponse {
    items: User[];
    total: number;
    page: number;
    size: number;
    pages: number;
  }
  
  export interface UserSearchParams {
    page?: number;
    size?: number;
    keyword?: string;
    is_active?: boolean;
    is_superuser?: boolean;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }