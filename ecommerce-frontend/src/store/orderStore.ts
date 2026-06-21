import { create } from 'zustand';

import { orderApi } from '../api/order';
import type { Order } from '../types/order';

interface OrderState {
  orders: Order[];
  total: number;
  isLoading: boolean;
  fetchOrders: (skip?: number, limit?: number) => Promise<void>;
  cancelOrder: (orderId: number, reason: string) => Promise<void>;
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
      console.error('Failed to fetch orders:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  cancelOrder: async (orderId, reason) => {
    try {
      await orderApi.cancel(orderId, reason);
      await get().fetchOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      throw error;
    }
  },

  payOrder: async (orderId) => {
    try {
      await orderApi.pay(orderId);
      await get().fetchOrders();
    } catch (error) {
      console.error('Failed to pay order:', error);
      throw error;
    }
  },

  deleteOrder: async (orderId) => {
    try {
      await orderApi.delete(orderId);
      set((state) => ({
        orders: state.orders.filter((order) => order.id !== orderId),
        total: Math.max(state.total - 1, 0),
      }));
    } catch (error) {
      console.error('Failed to delete order:', error);
      throw error;
    }
  },

  clearOrders: () => set({ orders: [], total: 0 }),
}));
