// src/store/orderStore.ts
import { create } from 'zustand';
import { orderApi } from '../api/order';
import type { Order } from '../types/order';

interface OrderState {
  orders: Order[];
  total: number;
  isLoading: boolean;
  fetchOrders: (skip?: number, limit?: number) => Promise<void>;
  cancelOrder: (orderId: number) => Promise<void>;
  payOrder: (orderId: number) => Promise<void>;
  deleteOrder: (orderId: number) => Promise<void>;
  clearOrders: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  total: 0,
  isLoading: false,

  fetchOrders: async (skip = 0, limit = 20) => {
    set({ isLoading: true });
    try {
      const data = await orderApi.list(skip, limit);
      set({ orders: data.items, total: data.total });
    } catch (error) {
      console.error('获取订单列表失败:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  cancelOrder: async (orderId: number) => {
    try {
      await orderApi.cancel(orderId);
      // 刷新订单列表（可选：直接更新本地状态）
      await get().fetchOrders();
    } catch (error) {
      console.error('取消订单失败:', error);
      throw error;
    }
  },

  payOrder: async (orderId: number) => {
    try {
      await orderApi.pay(orderId);
      await get().fetchOrders();
    } catch (error) {
      console.error('支付订单失败:', error);
      throw error;
    }
  },

  deleteOrder: async (orderId: number) => {
    try {
      await orderApi.delete(orderId);
      // 从本地列表移除，避免重新请求
      set(state => ({
        orders: state.orders.filter(o => o.id !== orderId),
        total: state.total - 1,
      }));
    } catch (error) {
      console.error('删除订单失败:', error);
      throw error;
    }
  },

  clearOrders: () => set({ orders: [], total: 0 }),
}));
