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
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  discount_amount: number;
  final_amount: number;
  applicable: boolean;
  reason: string;
  expires_at: string | null;
}

export const couponApi = {
  validate: async (data: CouponValidateRequest): Promise<CouponValidateResponse> => {
    const response = await apiClient.post('/coupons/validate', data);
    return response.data;
  },

  getAvailable: async (orderAmount: number): Promise<CouponAvailableItem[]> => {
    const response = await apiClient.get('/coupons/available', {
      params: { order_amount: orderAmount }
    });
    return response.data;
  },
};
