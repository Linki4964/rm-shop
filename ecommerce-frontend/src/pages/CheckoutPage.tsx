// src/pages/CheckoutPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { orderApi } from '../api/order';
import styles from './CheckoutPage.module.css';

const DEFAULT_IMAGE = 'https://via.placeholder.com/80?text=No+Image';
const getProductPrice = (price: number | string) => Number(price) || 0;
const buildPayUrl = (order: { id: number; order_number: string; total_amount: number | string }) => {
  const params = new URLSearchParams({
    orderId: String(order.id),
    orderNumber: order.order_number,
    totalAmount: String(order.total_amount)
  });
  return `/pay?${params.toString()}`;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, totalQuantity, isLoading, fetchCart } = useCartStore();
  const [checkoutItems, setCheckoutItems] = useState(items);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCart().finally(() => setCartLoaded(true));
  }, [fetchCart]);

  useEffect(() => {
    if (items.length) {
      setCheckoutItems(items);
    }
  }, [items]);

  useEffect(() => {
    if (cartLoaded && !isLoading && !submitting && !checkoutItems.length) {
      navigate('/');
    }
  }, [cartLoaded, checkoutItems.length, isLoading, navigate, submitting]);

  const checkoutTotalQuantity = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = checkoutItems.reduce((sum, item) => sum + getProductPrice(item.product.price) * item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (!shippingAddress.trim()) {
      setError('请填写收货地址');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const order = await orderApi.create({ shipping_address: shippingAddress });
      sessionStorage.setItem('pending_payment_order', JSON.stringify({
        orderId: order.id,
        orderNumber: order.order_number,
        totalAmount: order.total_amount
      }));
      // 跳转到支付方式选择页（购物车由 PayPage 清空）
      navigate(buildPayUrl(order), {
        state: {
          orderId: order.id,
          orderNumber: order.order_number,
          totalAmount: order.total_amount
        },
        replace: true
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || '创建订单失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!checkoutItems.length) {
    return (
      <div className={styles.container}>
        <div className="alert alert-warning">购物车为空，无法确认订单。</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className="fw-bold mb-4">确认订单</h3>
      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header bg-white fw-bold">商品清单</div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {checkoutItems.map((item) => {
                  const price = getProductPrice(item.product.price);
                  return (
                    <div key={item.id} className="list-group-item">
                      <div className="d-flex gap-3">
                        <img
                          src={item.product.image_url || DEFAULT_IMAGE}
                          alt={item.product.name}
                          style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                        />
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{item.product.name}</h6>
                          <div className="text-muted small">单价：¥{price.toFixed(2)}</div>
                          <div>数量：{item.quantity}</div>
                        </div>
                        <div className="text-danger fw-bold">¥{(price * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header bg-white fw-bold">订单信息</div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>商品总数：</span>
                <span>{checkoutTotalQuantity || totalQuantity} 件</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>合计金额：</span>
                <span className="text-danger fs-5 fw-bold">¥{totalAmount.toFixed(2)}</span>
              </div>
              <hr />
              <div className="mb-3">
                <label className="form-label fw-bold">收货地址</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="请填写详细收货地址（省市区+街道门牌）"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  required
                />
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              <button
                className="btn btn-danger w-100 py-2"
                onClick={handleSubmitOrder}
                disabled={submitting}
              >
                {submitting ? '提交中...' : '提交订单'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
