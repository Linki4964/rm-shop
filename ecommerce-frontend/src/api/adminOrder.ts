// src/api/adminOrder.ts
import apiClient from './client';
import type { AdminOrder, AdminOrderListResponse } from '../types/order';


export const adminOrderApi = {
  // 获取所有订单（管理员）
  list: async (params: { status?: string; skip?: number; limit?: number }): Promise<AdminOrderListResponse> => {
    const response = await apiClient.get('/admin/orders/', { params });
    return response.data;
  },
  // 获取订单详情（管理员）
  getDetail: async (orderId: number): Promise<AdminOrder> => {
    const response = await apiClient.get(`/admin/orders/${orderId}`);
    return response.data;
  },
  // 更新订单状态
  updateStatus: async (orderId: number, status: string): Promise<AdminOrder> => {
    const response = await apiClient.patch(`/admin/orders/${orderId}/status`, { status });
    return response.data;
  },
};