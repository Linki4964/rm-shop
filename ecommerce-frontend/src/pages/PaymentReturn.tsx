// src/pages/PaymentReturn.tsx
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const outTradeNo = searchParams.get('out_trade_no');

  useEffect(() => {
    // 通知父窗口支付成功（如果有父窗口）
    if (window.opener) {
      window.opener.postMessage(
        { type: 'PAYMENT_SUCCESS', outTradeNo },
        window.location.origin  // 限制消息来源为同源，更安全
      );
      // 给父窗口一点时间处理消息，然后关闭弹窗
      setTimeout(() => {
        window.close();
      }, 500);
    } else {
      // 没有父窗口（直接访问该链接），跳转到订单列表页
      window.location.href = '/orders';
    }
  }, [outTradeNo]);

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>支付成功！</h2>
      <p>页面即将关闭，请返回商城查看订单。</p>
    </div>
  );
};

export default PaymentReturn;