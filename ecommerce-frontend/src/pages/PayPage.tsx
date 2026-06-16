// src/pages/PayPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOrderStore } from '../store/orderStore';
import { useCartStore } from '../store/cartStore';
import { useToast, useConfirm } from '../components/Toast';
import styles from './PayPage.module.css';

type PaymentOrderState = {
  orderId?: number;
  orderNumber?: string;
  totalAmount?: number | string;
};

const getStoredPaymentOrder = (): PaymentOrderState => {
  try {
    return JSON.parse(sessionStorage.getItem('pending_payment_order') || '{}');
  } catch {
    return {};
  }
};

const getPaymentOrderFromSearch = (search: string): PaymentOrderState => {
  const params = new URLSearchParams(search);
  return {
    orderId: params.get('orderId') ? Number(params.get('orderId')) : undefined,
    orderNumber: params.get('orderNumber') || undefined,
    totalAmount: params.get('totalAmount') || undefined
  };
};

const PayPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const confirm = useConfirm();
  const { cancelOrder, payOrder } = useOrderStore();
  const fetchCart = useCartStore(s => s.fetchCart);

  // 从 checkout / 订单页跳转过来的订单信息
  const queryOrder = getPaymentOrderFromSearch(location.search);
  const storedOrder = getStoredPaymentOrder();
  const routeState = (location.state as PaymentOrderState | null) || {};
  const orderId = queryOrder.orderId ?? routeState.orderId ?? storedOrder.orderId;
  const orderNumber = queryOrder.orderNumber ?? routeState.orderNumber ?? storedOrder.orderNumber;
  const rawTotalAmount = queryOrder.totalAmount ?? routeState.totalAmount ?? storedOrder.totalAmount;
  const totalAmount = Number(rawTotalAmount);
  const hasOrderInfo = Boolean(orderId && orderNumber && Number.isFinite(totalAmount));

  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // 进入支付页时清空购物车
  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 无订单信息时保留在支付页，给用户一个可恢复的状态，避免白屏。
  useEffect(() => {
    if (!hasOrderInfo) {
      toast.error('订单信息缺失');
    }
  }, [hasOrderInfo, toast]);

  // 模拟支付
  const handlePay = async () => {
    if (!hasOrderInfo || !orderId) return;
    setPayLoading(true);
    setPayError('');
    try {
      await payOrder(orderId);
      sessionStorage.removeItem('pending_payment_order');
      toast.success('支付成功');
      navigate('/orders', { replace: true });
    } catch (err: any) {
      setPayError(err.response?.data?.detail || '支付失败，请重试');
    } finally {
      setPayLoading(false);
    }
  };

  // 取消订单
  const handleCancelOrder = async () => {
    if (!orderId) return;
    const ok = await confirm({
      title: '取消订单',
      message: '确定要取消该订单吗？取消后可在"我的订单"中查看。',
      confirmText: '确定取消',
      variant: 'danger'
    });
    if (!ok) return;
    setCancelling(true);
    try {
      await cancelOrder(orderId);
      sessionStorage.removeItem('pending_payment_order');
      toast.success('订单已取消');
      navigate('/orders', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || '取消失败');
    } finally {
      setCancelling(false);
    }
  };

  if (!hasOrderInfo) {
    return (
      <div className={styles.container}>
        <h3 className="fw-bold mb-4">订单支付</h3>
        <div className={styles.errorBox}>
          <i className="bi bi-exclamation-triangle-fill" />
          <span>订单信息缺失，请从“我的订单”重新进入支付。</span>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/orders', { replace: true })}>
          返回我的订单
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className="fw-bold mb-4">订单支付</h3>

      {/* 订单信息 */}
      <div className={styles.orderCard}>
        <div className={styles.orderHeader}>
          <h4 className={styles.orderTitle}>
            订单详情
            <span className={styles.orderNumber}> #{orderNumber}</span>
          </h4>
        </div>
        <div className={styles.orderRow}>
          <span className={styles.orderLabel}>订单编号</span>
          <span className={styles.orderValue}>{orderNumber}</span>
        </div>
        <div className={styles.orderRow}>
          <span className={styles.orderLabel}>应付金额</span>
          <span className={styles.totalAmount}>¥{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* 错误提示 */}
      {payError && (
        <div className={styles.errorBox}>
          <i className="bi bi-exclamation-triangle-fill" />
          <span>{payError}</span>
        </div>
      )}

      <div className={styles.methodsSection}>
        <h4 className={styles.methodsTitle}>模拟支付</h4>
        <button
          className={styles.payBtn}
          onClick={handlePay}
          disabled={payLoading || cancelling}
        >
          {payLoading ? (
            <>
              <i className={`bi bi-arrow-repeat ${styles.spin} me-1`} />
              支付中...
            </>
          ) : (
            '立即支付'
          )}
        </button>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.cancelBtn}
          onClick={handleCancelOrder}
          disabled={cancelling || payLoading}
        >
          {cancelling ? (
            <>
              <i className={`bi bi-arrow-repeat ${styles.spin} me-1`} />
              取消中...
            </>
          ) : (
            '取消订单'
          )}
        </button>
      </div>
    </div>
  );
};

export default PayPage;
