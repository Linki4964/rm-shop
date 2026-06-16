// src/api/productPublic.ts
import apiClient from './client';
import type { Product, ProductListResponse, ProductSearchParams } from '../types/product';

/**
 * 公开商品接口（无需认证）
 * 对应后端路由：/api/v1/products/
 */
export const productPublicApi = {
  /**
   * 获取商品列表（分页、筛选、排序）
   * @param params - 查询参数（可选）
   * @returns 商品列表及分页信息
   */
  list: async (params?: ProductSearchParams): Promise<ProductListResponse> => {
    const response = await apiClient.get<ProductListResponse>('/products/', { params });
    return response.data;
  },

  /**
   * 获取商品详情
   * @param id - 商品ID
   * @returns 商品详情
   */
  getDetail: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  /**
   * 获取所有商品分类
   * @returns 分类名称数组
   */
  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/products/categories/all');
    return response.data;
  },
};