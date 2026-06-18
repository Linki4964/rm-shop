import apiClient from './client';
import type { Product } from '../types/product';

export interface FavoriteItem {
  id: number;
  product_id: number;
  created_at: string;
  product: Product | null;
}

export const favoriteApi = {
  toggle: async (productId: number): Promise<{ favorited: boolean }> => {
    const response = await apiClient.post(`/favorites/toggle/${productId}`);
    return response.data;
  },

  check: async (productIds: number[]): Promise<Record<string, boolean>> => {
    if (!productIds.length) return {};
    const response = await apiClient.get('/favorites/check', {
      params: { ids: productIds.join(',') }
    });
    return response.data;
  },

  list: async (skip = 0, limit = 50): Promise<FavoriteItem[]> => {
    const response = await apiClient.get('/favorites/', {
      params: { skip, limit }
    });
    return response.data;
  },
};
