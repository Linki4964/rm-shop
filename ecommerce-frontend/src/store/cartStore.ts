// src/store/cartStore.ts
import { create } from 'zustand';
import { cartApi } from '../api/cart';
import type { CartItem, AddToCartData } from '../types/cart';

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalQuantity: number;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (data: AddToCartData) => Promise<void>;
  updateItemQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalItems: 0,
  totalQuantity: 0,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const data = await cartApi.getCart();
      set({
        items: data.items,
        totalItems: data.total_items,
        totalQuantity: data.total_quantity,
      });
    } catch (error) {
      console.error('获取购物车失败:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (data) => {
    try {
      await cartApi.addItem(data);
      // 添加成功后重新获取整个购物车以保持同步
      await get().fetchCart();
    } catch (error) {
      console.error('添加购物车失败:', error);
      throw error;
    }
  },

  updateItemQuantity: async (itemId, quantity) => {
    try {
      await cartApi.updateItem(itemId, { quantity });
      await get().fetchCart();
    } catch (error) {
      console.error('更新数量失败:', error);
      throw error;
    }
  },

  removeItem: async (itemId) => {
    try {
      await cartApi.removeItem(itemId);
      await get().fetchCart();
    } catch (error) {
      console.error('删除商品失败:', error);
      throw error;
    }
  },

  clearCart: async () => {
    try {
      await cartApi.clearCart();
      await get().fetchCart();
    } catch (error) {
      console.error('清空购物车失败:', error);
      throw error;
    }
  },
}));
