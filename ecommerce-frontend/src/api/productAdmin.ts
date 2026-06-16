// src/api/productAdmin.ts
import apiClient from './client';
import type  {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductListResponse,
  ProductSearchParams,
} from '../types/product';

export const productAdminApi = {
  // 获取商品列表（管理员）
  list: async (params: ProductSearchParams): Promise<ProductListResponse> => {
    const response = await apiClient.get('/admin/products/', { params });
    return response.data;
  },

  // 创建商品
  create: async (data: ProductCreate): Promise<Product> => {
    const response = await apiClient.post('/admin/products/', data);
    return response.data;
  },

  // 更新商品
  update: async (id: number, data: ProductUpdate): Promise<Product> => {
    const response = await apiClient.put(`/admin/products/${id}`, data);
    return response.data;
  },

  // 删除商品
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/products/${id}`);
  },

  // 切换上架状态
  toggleStatus: async (id: number, is_active: boolean): Promise<Product> => {
    const response = await apiClient.patch(`/admin/products/${id}/toggle-status`, null, {
      params: { is_active },
    });
    return response.data;
  },

  // 更新库存
  updateStock: async (id: number, stock: number): Promise<Product> => {
    const response = await apiClient.patch(`/admin/products/${id}/stock`, null, {
      params: { stock },
    });
    return response.data;
  },
};

// 公开商品接口（用于获取分类下拉等）
export const productPublicApi = {
  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get('/products/categories/all');
    return response.data;
  },
};