import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { orderApi } from '../../api/order';
import { useConfirm, useToast } from '../Toast';
import { useOrderStore } from '../../store/orderStore';
import type { Order } from '../../types/order';
import styles from './OrdersPanel.module.css';

const DEFAULT_IMAGE = 'https://via.placeholder.com/60?text=No+Image';

const STATUS_MAP: Record<string, string> = {
  pending: '待付款',
  paid: '已支付',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
};

const AFTER_SALE_MAP: Record<string, string> = {
  none: '未申请售后',
  requested: '售后待审核',
  approved: '售后已同意',
  rejected: '售后已驳回',
};

const getPrice = (price: number | string) => Number(price) || 0;

const buildPayUrl = (order: Order) => {
  const params = new URLSearchParams({
    orderId: String(order.id),
    orderNumber: order.order_number,
    totalAmount: String(order.total_amount),
  });
  return `/pay?${params.toString()}`;
};

const buildTimeline = (order: Order) => {
  const base = [
    { key: 'created', label: '订单提交', done: true, desc: '订单已生成，等待处理' },
    { key: 'paid', label: '买家付款', done: ['paid', 'shipped', 'completed'].includes(order.status), desc: '付款完成后进入发货流程' },
    { key: 'shipped', label: '商家发货', done: ['shipped', 'completed'].includes(order.status), desc: '该节点由管理员后台手动更新' },
    { key: 'completed', label: '交易完成', done: order.status === 'completed', desc: '确认收货或后台完成订单后达成' },
  ];

  if (order.status === 'cancelled') {
    return [
      base[0],
      { key: 'cancelled', label: '订单取消', done: true, desc: order.cancel_reason || '订单已取消' },
    ];
  }

  return base;
};

type OrdersPanelProps = {
  autoFetch?: boolean;
  embedded?: boolean;
  showTitle?: boolean;
};

const OrdersPanel = ({ autoFetch = true, embedded = false, showTitle = true }: OrdersPanelProps) => {
  const navigate = useNavigate();
  const { orders, isLoading, fetchOrders, cancelOrder, deleteOrder } = useOrderStore();
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    if (autoFetch) {
      fetchOrders();
    }
  }, [autoFetch, fetchOrders]);

  const handleCancel = async (orderId: number) => {
    const ok = await confirm({ message: '确定要取消这笔订单吗？' });
    if (!ok) return;

    const reason = window.prompt('请输入取消原因', '不想买了');
    if (!reason?.trim()) return;

    try {
      await cancelOrder(orderId, reason.trim());
      toast.success('订单已取消');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '取消失败');
    }
  };

  const handleDelete = async (orderId: number) => {
    const ok = await confirm({ message: '确定要删除这笔订单吗？删除后不可恢复。' });
    if (!ok) return;

    try {
      await deleteOrder(orderId);
      toast.success('订单已删除');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '删除失败');
    }
  };

  const handleAfterSale = async (orderId: number) => {
    const reason = window.prompt('请输入退款/退货申请原因', '商品不符合预期');
    if (!reason?.trim()) return;

    try {
      await orderApi.requestAfterSale(orderId, reason.trim());
      await fetchOrders();
      toast.success('售后申请已提交');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '售后申请失败');
    }
  };

  const handleGoPay = (order: Order) => {
    sessionStorage.setItem('pending_payment_order', JSON.stringify({
      orderId: order.id,
      orderNumber: order.order_number,
      totalAmount: order.total_amount,
    }));

    navigate(buildPayUrl(order), {
      state: {
        orderId: order.id,
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-danger" />
      </div>
    );
  }

  const containerClassName = embedded ? `${styles.container} ${styles.embedded}` : styles.container;

  return (
    <div className={containerClassName}>
      {showTitle && <h3 className={styles.title}>我的订单</h3>}
      {orders.length === 0 ? (
        <div className={styles.emptyContainer}>
          <i className="bi bi-bag fs-1 text-muted" />
          <p className="mt-3 text-muted">暂无订单，去逛逛吧。</p>
          <a href="/" className="btn btn-danger mt-2">前往首页</a>
        </div>
      ) : (
        <div className={styles.orderList}>
          {orders.map((order) => {
            const timeline = buildTimeline(order);
            const afterSaleStatus = order.after_sale_status || 'none';

            return (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.orderMeta}>
                    <span className={styles.orderNumber}>订单号：{order.order_number}</span>
                    <span className={styles.orderDate}>{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  <div className={styles.orderStatus}>
                    <span className={`${styles.badge} ${styles[`badge-${order.status}`] || styles['badge-default']}`}>
                      {STATUS_MAP[order.status] || order.status}
                    </span>
                  </div>
                </div>

                <div className={styles.orderBody}>
                  <div className={styles.orderAddress}>
                    <i className="bi bi-geo-alt" /> {order.shipping_address}
                  </div>
                  <div className={styles.timeline}>
                    {timeline.map((node) => (
                      <div key={node.key} className={`${styles.timelineItem} ${node.done ? styles.timelineDone : ''}`}>
                        <div className={styles.timelineDot} />
                        <div>
                          <div className={styles.timelineLabel}>{node.label}</div>
                          <div className={styles.timelineDesc}>{node.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {order.cancel_reason && <div className={styles.metaText}>取消原因：{order.cancel_reason}</div>}
                  {afterSaleStatus !== 'none' && (
                    <div className={styles.metaText}>
                      {AFTER_SALE_MAP[afterSaleStatus] || afterSaleStatus}
                      {order.after_sale_reason ? `：${order.after_sale_reason}` : ''}
                    </div>
                  )}
                  <div className={styles.orderItems}>
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className={styles.itemThumb}>
                        <img src={item.product?.image_url || DEFAULT_IMAGE} alt={item.product_name || '商品'} />
                      </div>
                    ))}
                    {order.items.length > 3 && <div className={styles.itemMore}>+{order.items.length - 3}</div>}
                  </div>
                </div>

                <div className={styles.orderFooter}>
                  <div className={styles.orderTotal}>
                    共 {order.items.length} 件商品，
                    {order.coupon_code && (
                      <span className="text-success small ms-2">
                        <i className="bi bi-tag-fill" /> {order.coupon_code} -¥{Number(order.discount_amount || 0).toFixed(2)}
                      </span>
                    )}
                    <strong className="text-danger ms-2">¥{getPrice(order.total_amount).toFixed(2)}</strong>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    {order.status === 'pending' && (
                      <>
                        <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => handleCancel(order.id)}>取消订单</button>
                        <button className="btn btn-sm btn-danger rounded-pill" onClick={() => handleGoPay(order)}>去支付</button>
                      </>
                    )}
                    {['paid', 'shipped', 'completed'].includes(order.status) && order.after_sale_status !== 'requested' && (
                      <button className="btn btn-sm btn-outline-warning rounded-pill" onClick={() => handleAfterSale(order.id)}>申请售后</button>
                    )}
                    {(order.status === 'completed' || order.status === 'cancelled') && (
                      <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => handleDelete(order.id)}>删除订单</button>
                    )}
                    <button
                      className="btn btn-sm btn-outline-secondary rounded-pill"
                      onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                    >
                      {expandedOrderId === order.id ? '收起详情' : '展开详情'}
                    </button>
                  </div>
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
                          {order.items.map((item) => {
                            const price = getPrice(item.price);
                            return (
                              <tr key={item.id}>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <img
                                      src={item.product?.image_url || DEFAULT_IMAGE}
                                      alt={item.product_name || '商品'}
                                      style={{ width: 40, height: 40, objectFit: 'contain' }}
                                    />
                                    <span>{item.product_name}</span>
                                  </div>
                                </td>
                                <td>¥{price.toFixed(2)}</td>
                                <td>{item.quantity}</td>
                                <td>¥{(price * item.quantity).toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPanel;
