// src/pages/PayPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCode } from 'react-qr-code';
import { paymentApi } from '../api/payment';
import { useOrderStore } from '../store/orderStore';
import { useCartStore } from '../store/cartStore';
import { useToast, useConfirm } from '../components/Toast';
import styles from './PayPage.module.css';

const PayPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const confirm = useConfirm();
  const { cancelOrder } = useOrderStore();
  const fetchCart = useCartStore(s => s.fetchCart);

  // 从 checkout / 订单页跳转过来的订单信息
  const orderId = (location.state as any)?.orderId as number | undefined;
  const orderNumber = (location.state as any)?.orderNumber as string | undefined;
  const totalAmount = (location.state as any)?.totalAmount as number | undefined;
  const statePayUrl = (location.state as any)?.payUrl as string | undefined;

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState(statePayUrl || '');
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // 进入支付页时清空购物车
  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 无订单信息 → 回订单页
  useEffect(() => {
    if (!orderId || !orderNumber || totalAmount === undefined) {
      toast.error('订单信息缺失');
      navigate('/orders', { replace: true });
    }
  }, [orderId, orderNumber, totalAmount, navigate, toast]);

  // 创建支付宝支付
  const handleAlipay = async () => {
    if (!orderId || !orderNumber || totalAmount === undefined) return;
    setSelectedMethod('alipay');
    setPayLoading(true);
    setPayError('');
    try {
      const result = await paymentApi.createPaymentFromOrder(orderId, {
        out_trade_no: orderNumber,
        total_amount: totalAmount,
        subject: `EasyShop订单-${orderNumber}`,
        body: `订单支付`
      });
      if (result.pay_url) {
        setPayUrl(result.pay_url);
      } else {
        setPayError('支付宝未返回支付链接，请检查 API 配置');
      }
    } catch (err: any) {
      setPayError(err.response?.data?.detail || '支付宝接口调用失败，请确认已配置 APP_ID 与密钥');
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
      toast.success('订单已取消');
      navigate('/orders', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || '取消失败');
    } finally {
      setCancelling(false);
    }
  };

  if (!orderId || !orderNumber || totalAmount === undefined) {
    return null;
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

      {/* 二维码展示区 */}
      {payUrl ? (
        <div className={styles.qrSection}>
          <QRCode value={payUrl} size={200} />
          <p>请使用支付宝扫描二维码完成支付</p>
          <div className={styles.qrActions}>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                setPayUrl('');
                setPayError('');
                setSelectedMethod(null);
              }}
            >
              返回重选
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/orders')}
            >
              完成支付
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 支付方式选择 */}
          <div className={styles.methodsSection}>
            <h4 className={styles.methodsTitle}>选择支付方式</h4>
            <div
              className={`${styles.methodCard} ${selectedMethod === 'alipay' && !payError ? styles.methodCardSelected : ''} ${payLoading ? styles.methodDisabled : ''}`}
              onClick={payLoading ? undefined : handleAlipay}
            >
              <div className={`${styles.methodIcon} ${styles.alipayIcon}`}>支</div>
              <div>
                <div className={styles.methodName}>支付宝</div>
                <div className={styles.methodDesc}>使用支付宝扫码支付</div>
              </div>
              <i className={`bi bi-chevron-right ${styles.methodArrow}`} />
            </div>
          </div>

          {/* 底部操作 */}
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
        </>
      )}
    </div>
  );
};

export default PayPage;
