// src/pages/admin/Orders.tsx
import { useEffect, useState, useCallback } from 'react';
import { adminOrderApi } from '../../api/adminOrder';
import type { AdminOrder } from '../../types/order';
import styles from './Orders.module.css';

const STATUS_OPTIONS = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];
const STATUS_MAP: Record<string, string> = {
  pending: '待处理',
  paid: '已支付',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
};

const Orders = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');

  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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
    } catch (err) {
      console.error(err);
      alert('加载订单列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, size, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleViewDetail = async (orderId: number) => {
    try {
      const order = await adminOrderApi.getDetail(orderId);
      setSelectedOrder(order);
      setModalVisible(true);
    } catch (err) {
      alert('获取订单详情失败');
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    if (!window.confirm(`确定将订单状态改为“${STATUS_MAP[newStatus]}”吗？`)) return;
    setUpdatingStatus(true);
    try {
      await adminOrderApi.updateStatus(orderId, newStatus);
      // 刷新列表
      fetchOrders();
      // 如果详情模态框打开且是当前订单，更新 selectedOrder
      if (selectedOrder && selectedOrder.id === orderId) {
        const updated = await adminOrderApi.getDetail(orderId);
        setSelectedOrder(updated);
      }
    } catch (err) {
      alert('状态更新失败');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const totalPages = Math.ceil(total / size);

  return (
    <div className={styles.container}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold">订单管理</h3>
      </div>

      {/* 筛选栏 */}
      <div className="card mb-4 p-3">
        <div className="row g-3">
          <div className="col-md-3">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">全部状态</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_MAP[s]}</option>
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

      {/* 订单表格 */}
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
                  <th>状态</th>
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
                    <td>¥{order.total_amount.toFixed(2)}</td>
                    <td>
                      <span className={`badge bg-${getStatusBadgeColor(order.status)}`}>
                        {STATUS_MAP[order.status]}
                      </span>
                    </td>
                    <td>{order.shipping_address}</td>
                    <td>{new Date(order.created_at).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => handleViewDetail(order.id)}
                      >
                        详情
                      </button>
                      <select
                        className="form-select form-select-sm d-inline-block w-auto"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingStatus}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{STATUS_MAP[s]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-muted">暂无订单</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <nav>
              <ul className="pagination justify-content-center">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => p - 1)}>上一页</button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                  </li>
                ))}
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => p + 1)}>下一页</button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}

      {/* 订单详情模态框 */}
      {modalVisible && selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setModalVisible(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
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
                <strong>下单时间：</strong> {new Date(selectedOrder.created_at).toLocaleString()}
              </div>
              <div className="mb-3">
                <strong>订单项：</strong>
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
                        <td>¥{item.price.toFixed(2)}</td>
                        <td>{item.quantity}</td>
                        <td>¥{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-end fw-bold fs-5">
                总计：¥{selectedOrder.total_amount.toFixed(2)}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.closeFooterBtn} onClick={() => setModalVisible(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 辅助函数：状态徽章颜色
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

export default Orders;