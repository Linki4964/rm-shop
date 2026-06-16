import apiClient from './client';

export const paymentApi = {
  createAlipay: async (orderId: number) => {
    const response = await apiClient.post('/payment/alipay/create', null, {
      params: { order_id: orderId }
    });
    return response.data; // { pay_url, order_id }
  },
  // 新增：直接使用订单信息创建支付（POST JSON）
  createPaymentFromOrder: async (orderId: number, payload: {
    out_trade_no: string;
    total_amount: number;
    subject: string;
    body: string;
  }) => {
    const response = await apiClient.post('/payment/alipay/create', payload, {
      params: { order_id: orderId }   // 加上查询参数
    });
    return response.data;
  },
  // 查询支付状态
  queryPayment: async (orderId: number) => {
    const response = await apiClient.get('/payment/alipay/query', {
      params: { order_id: orderId }
    });
    return response.data; // { status, message, trade_no? }
  }
};

