// src/api/order.ts
import apiClient from './client';
import type { Order, OrderCreate, OrderListResponse } from '../types/order';

export const orderApi = {
  // 创建订单（从购物车）
  create: async (data: OrderCreate): Promise<Order> => {
    const response = await apiClient.post('/orders/', data);
    return response.data;
  },
  // 获取当前用户订单列表
  list: async (skip = 0, limit = 20): Promise<OrderListResponse> => {
    const response = await apiClient.get('/orders/', { params: { skip, limit } });
    return response.data;
  },
  // 获取订单详情
  getDetail: async (orderId: number): Promise<Order> => {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  },
  // 取消订单
  cancel: async (orderId: number): Promise<Order> => {
    const response = await apiClient.put(`/orders/${orderId}/cancel`);
    return response.data;
  },
};