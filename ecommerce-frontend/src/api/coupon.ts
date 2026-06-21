import apiClient from './client';

export interface CouponValidateRequest {
  code: string;
  order_amount: number;
}

export interface CouponValidateResponse {
  valid: boolean;
  code: string;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  final_amount: number;
  message: string;
}

export interface CouponAvailableItem {
  coupon_id: number;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  discount_amount: number;
  final_amount: number;
  applicable: boolean;
  reason: string;
  expires_at: string | null;
  is_claimed: boolean;
}

export interface CouponAdminItem {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  is_active: boolean;
  usage_limit: number;
  used_count: number;
  expires_at: string | null;
  created_at: string;
}

export interface UserCouponItem {
  id: number;
  status: 'claimed' | 'used';
  claimed_at: string;
  used_at: string | null;
  coupon: CouponAdminItem;
}

export const couponApi = {
  validate: async (data: CouponValidateRequest): Promise<CouponValidateResponse> => {
    const response = await apiClient.post('/coupons/validate', data);
    return response.data;
  },

  getAvailable: async (orderAmount: number, claimedOnly = false): Promise<CouponAvailableItem[]> => {
    const response = await apiClient.get('/coupons/available', {
      params: { order_amount: orderAmount, claimed_only: claimedOnly }
    });
    return response.data;
  },

  claim: async (couponId: number): Promise<UserCouponItem> => {
    const response = await apiClient.post(`/coupons/claim/${couponId}`);
    return response.data;
  },

  mine: async (status?: string): Promise<UserCouponItem[]> => {
    const response = await apiClient.get('/coupons/mine', { params: status ? { status } : undefined });
    return response.data;
  }
};

export const couponAdminApi = {
  list: async (): Promise<CouponAdminItem[]> => {
    const response = await apiClient.get('/admin/coupons/');
    return response.data;
  },

  create: async (data: Omit<CouponAdminItem, 'id' | 'used_count' | 'created_at'>): Promise<CouponAdminItem> => {
    const response = await apiClient.post('/admin/coupons/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Omit<CouponAdminItem, 'id' | 'used_count' | 'created_at'>>): Promise<CouponAdminItem> => {
    const response = await apiClient.put(`/admin/coupons/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/coupons/${id}`);
  }
};
