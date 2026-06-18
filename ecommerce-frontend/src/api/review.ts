import apiClient from './client';

export interface ReviewUser {
  id: number;
  username: string;
  full_name: string | null;
}

export interface ReviewItem {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  user: ReviewUser | null;
}

export interface ReviewStats {
  average: number;
  count: number;
  distribution: Record<string, number>;
}

export const reviewApi = {
  list: async (productId: number): Promise<ReviewItem[]> => {
    const res = await apiClient.get(`/reviews/product/${productId}`);
    return res.data;
  },

  stats: async (productId: number): Promise<ReviewStats> => {
    const res = await apiClient.get(`/reviews/product/${productId}/stats`);
    return res.data;
  },

  create: async (productId: number, data: { rating: number; comment?: string }): Promise<ReviewItem> => {
    const res = await apiClient.post(`/reviews/product/${productId}`, data);
    return res.data;
  },
};
