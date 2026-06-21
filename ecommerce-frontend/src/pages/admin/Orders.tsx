import { useCallback, useEffect, useState } from 'react';

import { adminOrderApi } from '../../api/adminOrder';
import { useConfirm, useToast } from '../../components/Toast';
import type { AdminOrder } from '../../types/order';
import styles from './Orders.module.css';

const STATUS_OPTIONS = ['pending', 'paid', 'shipped', 'completed', 'cancelled'] as const;

const STATUS_MAP: Record<string, string> = {
  pending: '待处理',
  paid: '已支付',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
};

const AFTER_SALE_MAP: Record<string, string> = {
  none: '未申请',
  requested: '待审批',
  approved: '已同意',
  rejected: '已驳回',
};

const Orders = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [reviewingAfterSale, setReviewingAfterSale] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminOrderApi.list({
        status: statusFilter || undefined,
        skip: (page - 1) * size,
        limit: size,
      });
      setOrders(res.items);
      setTotal(res.total);
    } catch (error) {
      console.error(error);
      toast.error('加载订单列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, size, statusFilter, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const refreshSelectedOrder = useCallback(async (orderId: number) => {
    if (!selectedOrder || selectedOrder.id !== orderId) return;
    const order = await adminOrderApi.getDetail(orderId);
    setSelectedOrder(order);
  }, [selectedOrder]);

  const handleViewDetail = async (orderId: number) => {
    try {
      const order = await adminOrderApi.getDetail(orderId);
      setSelectedOrder(order);
      setModalVisible(true);
    } catch (error) {
      console.error(error);
      toast.error('获取订单详情失败');
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    const ok = await confirm({ message: `确定将订单状态改为“${STATUS_MAP[newStatus]}”吗？` });
    if (!ok) return;

    setUpdatingStatus(true);
    try {
      await adminOrderApi.updateStatus(orderId, newStatus);
      await fetchOrders();
      await refreshSelectedOrder(orderId);
      toast.success('订单状态已更新');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '订单状态更新失败');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAfterSaleReview = async (orderId: number, reviewStatus: 'approved' | 'rejected') => {
    const actionText = reviewStatus === 'approved' ? '同意' : '驳回';
    const ok = await confirm({ message: `确定要${actionText}这笔订单的售后申请吗？` });
    if (!ok) return;

    setReviewingAfterSale(true);
    try {
      await adminOrderApi.reviewAfterSale(orderId, reviewStatus);
      await fetchOrders();
      await refreshSelectedOrder(orderId);
      toast.success(`售后申请已${actionText}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '售后审批失败');
    } finally {
      setReviewingAfterSale(false);
    }
  };

  const totalPages = Math.ceil(total / size);

  return (
    <div className={styles.container}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold">订单管理</h3>
      </div>

      <div className="card mb-4 p-3">
        <div className="row g-3">
          <div className="col-md-3">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">全部状态</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_MAP[status]}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn btn-outline-secondary w-100" onClick={() => fetchOrders()}>
              搜索
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" />
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>订单号</th>
                  <th>用户</th>
                  <th>总金额</th>
                  <th>订单状态</th>
                  <th>售后状态</th>
                  <th>收货地址</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.order_number}</td>
                    <td>{order.user?.username || '-'}</td>
                    <td>￥{order.total_amount.toFixed(2)}</td>
                    <td>
                      <span className={`badge bg-${getStatusBadgeColor(order.status)}`}>
                        {STATUS_MAP[order.status]}
                      </span>
                    </td>
                    <td>
                      <span className={`badge bg-${getAfterSaleBadgeColor(order.after_sale_status)}`}>
                        {AFTER_SALE_MAP[order.after_sale_status || 'none'] || order.after_sale_status || '未申请'}
                      </span>
                    </td>
                    <td>{order.shipping_address}</td>
                    <td>{new Date(order.created_at).toLocaleString()}</td>
                    <td>
                      <div className={styles.actionGroup}>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleViewDetail(order.id)}>
                          详情
                        </button>
                        <select
                          className="form-select form-select-sm"
                          value={order.status}
                          onChange={(event) => handleStatusChange(order.id, event.target.value)}
                          disabled={updatingStatus}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {STATUS_MAP[status]}
                            </option>
                          ))}
                        </select>
                        {order.after_sale_status === 'requested' && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleAfterSaleReview(order.id, 'approved')}
                              disabled={reviewingAfterSale}
                            >
                              同意售后
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleAfterSaleReview(order.id, 'rejected')}
                              disabled={reviewingAfterSale}
                            >
                              驳回售后
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center text-muted">暂无订单</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav>
              <ul className="pagination justify-content-center">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((current) => current - 1)}>上一页</button>
                </li>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <li key={pageNumber} className={`page-item ${page === pageNumber ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(pageNumber)}>{pageNumber}</button>
                  </li>
                ))}
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((current) => current + 1)}>下一页</button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}

      {modalVisible && selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setModalVisible(false)}>
          <div className={styles.modalContent} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h5>订单详情 #{selectedOrder.order_number}</h5>
              <button className={styles.closeBtn} onClick={() => setModalVisible(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className="mb-3">
                <strong>用户：</strong> {selectedOrder.user?.username} ({selectedOrder.user?.email})
              </div>
              <div className="mb-3">
                <strong>收货地址：</strong> {selectedOrder.shipping_address}
              </div>
              <div className="mb-3">
                <strong>订单状态：</strong>{' '}
                <span className={`badge bg-${getStatusBadgeColor(selectedOrder.status)}`}>
                  {STATUS_MAP[selectedOrder.status]}
                </span>
              </div>
              <div className="mb-3">
                <strong>售后状态：</strong>{' '}
                <span className={`badge bg-${getAfterSaleBadgeColor(selectedOrder.after_sale_status)}`}>
                  {AFTER_SALE_MAP[selectedOrder.after_sale_status || 'none'] || selectedOrder.after_sale_status || '未申请'}
                </span>
              </div>
              {selectedOrder.after_sale_reason && (
                <div className="mb-3">
                  <strong>售后原因：</strong> {selectedOrder.after_sale_reason}
                </div>
              )}
              {selectedOrder.cancel_reason && (
                <div className="mb-3">
                  <strong>取消原因：</strong> {selectedOrder.cancel_reason}
                </div>
              )}
              <div className="mb-3">
                <strong>下单时间：</strong> {new Date(selectedOrder.created_at).toLocaleString()}
              </div>
              <div className="mb-3">
                <strong>订单商品：</strong>
                <table className="table table-sm mt-2">
                  <thead>
                    <tr>
                      <th>商品</th>
                      <th>单价</th>
                      <th>数量</th>
                      <th>小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.product_name || `商品ID: ${item.product_id}`}</td>
                        <td>￥{item.price.toFixed(2)}</td>
                        <td>{item.quantity}</td>
                        <td>￥{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-end fw-bold fs-5">
                总计：￥{selectedOrder.total_amount.toFixed(2)}
              </div>
            </div>
            <div className={styles.modalFooter}>
              {selectedOrder.after_sale_status === 'requested' && (
                <div className={styles.reviewActions}>
                  <button
                    className="btn btn-outline-success"
                    onClick={() => handleAfterSaleReview(selectedOrder.id, 'approved')}
                    disabled={reviewingAfterSale}
                  >
                    同意售后
                  </button>
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => handleAfterSaleReview(selectedOrder.id, 'rejected')}
                    disabled={reviewingAfterSale}
                  >
                    驳回售后
                  </button>
                </div>
              )}
              <button className={styles.closeFooterBtn} onClick={() => setModalVisible(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'pending': return 'warning';
    case 'paid': return 'info';
    case 'shipped': return 'primary';
    case 'completed': return 'success';
    case 'cancelled': return 'secondary';
    default: return 'secondary';
  }
}

function getAfterSaleBadgeColor(status?: string | null): string {
  switch (status) {
    case 'requested': return 'warning';
    case 'approved': return 'success';
    case 'rejected': return 'danger';
    default: return 'secondary';
  }
}

export default Orders;
