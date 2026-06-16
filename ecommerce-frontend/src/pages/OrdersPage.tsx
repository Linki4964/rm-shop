// src/pages/OrdersPage.tsx
import { useEffect, useState } from "react";
import { useOrderStore } from "../store/orderStore";
import { useNavigate } from "react-router-dom";
import { paymentApi } from '../api/payment';
import type { Order } from '../types/order';          // 导入 Order 类型
import styles from "./OrdersPage.module.css";

const DEFAULT_IMAGE = "https://via.placeholder.com/60?text=No+Image";

const OrdersPage = () => {
  const navigate = useNavigate();
  const { orders, total, isLoading, fetchOrders, cancelOrder } = useOrderStore();
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (orderId: number) => {
    if (!window.confirm("确定要取消该订单吗？")) return;
    try {
      await cancelOrder(orderId);
      alert("订单已取消");
    } catch (err: any) {
      alert(err.response?.data?.detail || "取消失败");
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: "待处理",
      paid: "已支付",
      shipped: "已发货",
      completed: "已完成",
      cancelled: "已取消",
    };
    return map[status] || status;
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending": return "badge-pending";
      case "paid": return "badge-paid";
      case "shipped": return "badge-shipped";
      case "completed": return "badge-completed";
      case "cancelled": return "badge-cancelled";
      default: return "badge-default";
    }
  };

  const toggleExpand = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // 支付处理函数
  const handleGoPay = async (order: Order) => {
    try {
      const payload = {
        out_trade_no: order.order_number,
        total_amount: order.total_amount,
        subject: `EasyShop订单-${order.order_number}`,
        body: `订单ID: ${order.id}，共${order.items.length}件商品`
      };
      const result = await paymentApi.createPaymentFromOrder(order.id,payload);
      if (result.pay_url) {
        navigate('/pay', { state: { payUrl: result.pay_url, orderId: order.id } });
      } else {
        navigate(`/pay?order_id=${order.id}`);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || '创建支付订单失败，请重试');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-danger" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <i className="bi bi-bag fs-1 text-muted"></i>
        <p className="mt-3 text-muted">暂无订单，去逛逛吧~</p>
        <a href="/" className="btn btn-danger mt-2">前往首页</a>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className="fw-bold mb-4">我的订单</h3>
      <div className={styles.orderList}>
        {orders.map((order) => (
          <div key={order.id} className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <div className={styles.orderMeta}>
                <span className={styles.orderNumber}>订单号：{order.order_number}</span>
                <span className={styles.orderDate}>{new Date(order.created_at).toLocaleString()}</span>
              </div>
              <div className={styles.orderStatus}>
                <span className={`${styles.badge} ${styles[getStatusClass(order.status)]}`}>
                  {getStatusText(order.status)}
                </span>
                {order.status === "pending" && (
                  <div className={styles.orderActions}>
                    <button
                      className={`btn btn-sm btn-outline-danger ${styles.cancelBtn}`}
                      onClick={() => handleCancel(order.id)}
                    >
                      取消订单
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleGoPay(order)}   // 修改为调用 handleGoPay
                    >
                      去支付
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.orderBody}>
              <div className={styles.orderAddress}>
                <i className="bi bi-geo-alt"></i> {order.shipping_address}
              </div>
              <div className={styles.orderItems}>
                {order.items.slice(0, 3).map((item) => (
                  <div key={item.id} className={styles.itemThumb}>
                    <img src={item.product?.image_url || DEFAULT_IMAGE} alt={item.product_name || "商品"} />
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className={styles.itemMore}>+{order.items.length - 3}</div>
                )}
              </div>
            </div>

            <div className={styles.orderFooter}>
              <div className={styles.orderTotal}>
                共 {order.items.length} 件商品，合计：
                <strong className="text-danger">￥{order.total_amount.toFixed(2)}</strong>
              </div>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => toggleExpand(order.id)}
              >
                {expandedOrderId === order.id ? "收起详情" : "展开详情"}
                <i className={`bi ${expandedOrderId === order.id ? "bi-chevron-up" : "bi-chevron-down"} ms-1`}></i>
              </button>
            </div>

            {expandedOrderId === order.id && (
              <div className={styles.orderDetail}>
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>商品</th>
                        <th>单价</th>
                        <th>数量</th>
                        <th>小计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <img
                                src={item.product?.image_url || DEFAULT_IMAGE}
                                alt={item.product_name || "商品"}
                                style={{ width: "40px", height: "40px", objectFit: "contain" }}
                              />
                              <span>{item.product_name}</span>
                            </div>
                          </td>
                          <td>￥{item.price.toFixed(2)}</td>
                          <td>{item.quantity}</td>
                          <td>￥{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;