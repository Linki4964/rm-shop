// src/api/cart.ts
import apiClient from './client';
import type { CartResponse, AddToCartData, UpdateCartItemData, CartItem } from '../types/cart';

export const cartApi = {
  // 获取购物车
  getCart: async (): Promise<CartResponse> => {
    const response = await apiClient.get('/cart/');
    return response.data;
  },

  // 添加商品到购物车
  addItem: async (data: AddToCartData): Promise<CartItem> => {
    const response = await apiClient.post('/cart/items', data);
    return response.data;
  },

  // 更新购物车商品数量
  updateItem: async (itemId: number, data: UpdateCartItemData): Promise<CartItem> => {
    const response = await apiClient.put(`/cart/items/${itemId}`, data);
    return response.data;
  },

  // 删除购物车商品
  removeItem: async (itemId: number): Promise<void> => {
    await apiClient.delete(`/cart/items/${itemId}`);
  },

  // 清空购物车
  clearCart: async (): Promise<void> => {
    await apiClient.delete('/cart/');
  },
};