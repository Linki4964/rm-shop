import apiClient from './client';
import type { Order, OrderCreate, OrderListResponse } from '../types/order';

export const orderApi = {
  create: async (data: OrderCreate): Promise<Order> => {
    const response = await apiClient.post('/orders/', data);
    return response.data;
  },

  list: async (skip = 0, limit = 20): Promise<OrderListResponse> => {
    const response = await apiClient.get('/orders/', { params: { skip, limit } });
    return response.data;
  },

  getDetail: async (orderId: number): Promise<Order> => {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  },

  cancel: async (orderId: number, reason: string): Promise<Order> => {
    const response = await apiClient.put(`/orders/${orderId}/cancel`, { reason });
    return response.data;
  },

  pay: async (orderId: number): Promise<Order> => {
    const response = await apiClient.put(`/orders/${orderId}/pay`);
    return response.data;
  },

  requestAfterSale: async (orderId: number, reason: string): Promise<Order> => {
    const response = await apiClient.put(`/orders/${orderId}/after-sale`, { reason });
    return response.data;
  },

  delete: async (orderId: number): Promise<void> => {
    await apiClient.delete(`/orders/${orderId}`);
  },
};
