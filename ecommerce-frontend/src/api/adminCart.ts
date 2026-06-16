import apiClient from './client';
import type { CartResponse, AdminCartOverviewResponse } from '../types/cart';

export const adminCartApi = {
  // 获取所有用户购物车概览
  list: async (params: { page?: number; size?: number; keyword?: string }): Promise<AdminCartOverviewResponse> => {
    const response = await apiClient.get('/admin/carts/', { params });
    return response.data;
  },
  // 获取指定用户购物车详情
  getUserCart: async (userId: number): Promise<CartResponse> => {
    const response = await apiClient.get(`/admin/carts/${userId}`);
    return response.data;
  },
  // 删除购物车项
  deleteItem: async (itemId: number): Promise<void> => {
    await apiClient.delete(`/admin/carts/items/${itemId}`);
  },
  // 清空用户购物车
  clearUserCart: async (userId: number): Promise<void> => {
    await apiClient.delete(`/admin/carts/user/${userId}`);
  },
};