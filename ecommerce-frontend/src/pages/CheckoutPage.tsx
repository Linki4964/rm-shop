// src/pages/CheckoutPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { orderApi } from '../api/order';
import styles from './CheckoutPage.module.css';

const DEFAULT_IMAGE = 'https://via.placeholder.com/80?text=No+Image';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, totalQuantity, totalItems, fetchCart } = useCartStore();
  const [shippingAddress, setShippingAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 如果购物车为空，跳回首页
    if (!items.length) {
      navigate('/');
    }
  }, [items, navigate]);

  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (!shippingAddress.trim()) {
      setError('请填写收货地址');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await orderApi.create({ shipping_address: shippingAddress });
      // 创建成功，刷新购物车状态（清空）
      await fetchCart();
      alert('订单已提交！');
      navigate('/orders');
    } catch (err: any) {
      setError(err.response?.data?.detail || '创建订单失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return null; // 重定向中
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
                {items.map((item) => (
                  <div key={item.id} className="list-group-item">
                    <div className="d-flex gap-3">
                      <img
                        src={item.product.image_url || DEFAULT_IMAGE}
                        alt={item.product.name}
                        style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                      />
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{item.product.name}</h6>
                        <div className="text-muted small">单价：¥{item.product.price.toFixed(2)}</div>
                        <div>数量：{item.quantity}</div>
                      </div>
                      <div className="text-danger fw-bold">¥{(item.product.price * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
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
                <span>{totalQuantity} 件</span>
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