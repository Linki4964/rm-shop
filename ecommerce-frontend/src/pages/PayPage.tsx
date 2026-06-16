// src/pages/PayPage.tsx
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { QRCode } from 'react-qr-code';
import { paymentApi } from '../api/payment';
import styles from './PayPage.module.css';

const PayPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // 获取订单ID
  const orderIdFromState = (location.state as any)?.orderId;
  const orderIdFromQuery = searchParams.get('order_id');
  const orderId = orderIdFromState || orderIdFromQuery;

  const [payUrl, setPayUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const popupRef = useRef<Window | null>(null);

  // 查询支付状态并跳转
  const handleCheckPayment = async (showMessage = true) => {
    if (!orderId) {
      console.error('handleCheckPayment: orderId 为空');
      return;
    }
    try {
      const res = await paymentApi.queryPayment(Number(orderId));
      if (res.status === 'paid') {
        if (showMessage) alert('支付成功！');
        navigate('/orders');
      } else if (res.status === 'pending') {
        if (showMessage) alert('订单尚未支付，请完成支付后再查询');
      } else if (res.status === 'closed') {
        if (showMessage) alert('订单已关闭');
        navigate('/orders');
      } else {
        if (showMessage) alert(res.message || '查询失败，请稍后手动查看订单状态');
      }
    } catch (err) {
      console.error('查询支付状态失败:', err);
      if (showMessage) alert('查询失败，请稍后手动查看订单状态');
    }
  };

  // 监听弹窗发送的支付成功消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 校验消息来源（可选，此处简化）
      if (event.data?.type === 'PAYMENT_SUCCESS') {
        // 关闭弹窗（如果还开着）
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
        alert('支付成功！');
        navigate('/orders');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  // 打开居中弹窗
  const openCenteredWindow = (url: string) => {
    const width = 800;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    popupRef.current = window.open(
      url,
      '_blank',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );
    if (popupRef.current) {
      // 如果用户手动关闭弹窗，也检查一次支付状态
      const checkClosed = setInterval(() => {
        if (popupRef.current?.closed) {
          clearInterval(checkClosed);
          handleCheckPayment(true);
        }
      }, 500);
    }
  };

  // 获取支付链接
  useEffect(() => {
    if (!orderId) {
      console.error('PayPage: orderId 无效');
      alert('无效订单');
      navigate('/orders');
      return;
    }

    const fetchPayUrl = async () => {
      try {
        const statePayUrl = (location.state as any)?.payUrl;
        if (statePayUrl) {
          setPayUrl(statePayUrl);
          setLoading(false);
          return;
        }
        const res = await paymentApi.createAlipay(Number(orderId));
        if (res?.pay_url) {
          setPayUrl(res.pay_url);
        } else {
          throw new Error('后端未返回 pay_url');
        }
      } catch (err: any) {
        console.error('创建支付失败:', err);
        alert('创建支付失败: ' + (err.response?.data?.detail || err.message));
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };

    fetchPayUrl();
  }, [orderId, location.state, navigate]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-danger" />
        <p>正在加载支付信息...</p>
      </div>
    );
  }

  if (!payUrl) {
    return (
      <div className="text-center py-5">
        <p>无法获取支付链接，请返回重试。</p>
        <button className="btn btn-primary" onClick={() => navigate('/orders')}>
          返回订单列表
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className="fw-bold mb-4">支付宝支付</h3>
      <div className="card p-4 text-center">
        <div className="mb-3">
          <QRCode value={payUrl} size={200} />
        </div>
        <p>
          请使用支付宝沙箱版APP扫描二维码或
          <button
            className="btn btn-link p-0 ms-1"
            onClick={() => openCenteredWindow(payUrl)}
            style={{ verticalAlign: 'baseline' }}
          >
            点击跳转
          </button>
        </p>
        <div className="mt-3">
          <button className="btn btn-primary mt-3" onClick={() => handleCheckPayment(true)}>
            完成支付后查看订单
          </button>
        </div>
        <small className="text-muted mt-2">支付成功后页面会自动跳转</small>
      </div>
    </div>
  );
};

export default PayPage;