import { useEffect, useState } from 'react';
import { adminCartApi } from '../../api/adminCart';
import type { AdminCartOverview, CartItem } from '../../types/cart';
import styles from './Carts.module.css';

const Carts = () => {
  const [users, setUsers] = useState<AdminCartOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminCartApi.list({ page, size, keyword: keyword || undefined });
      setUsers(res.items);
      setTotal(res.total);
      if (res.items.length > 0 && !selectedUserId) {
        setSelectedUserId(res.items[0].user_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, keyword]);

  useEffect(() => {
    if (selectedUserId) {
      setCartLoading(true);
      adminCartApi.getUserCart(selectedUserId)
        .then(res => setCartItems(res.items))
        .catch(console.error)
        .finally(() => setCartLoading(false));
    }
  }, [selectedUserId]);

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('确定删除该购物车项吗？')) return;
    try {
      await adminCartApi.deleteItem(itemId);
      // 刷新当前用户的购物车
      if (selectedUserId) {
        const res = await adminCartApi.getUserCart(selectedUserId);
        setCartItems(res.items);
      }
      // 同时刷新用户概览
      fetchUsers();
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleClearCart = async (userId: number) => {
    if (!confirm('确定清空该用户的购物车吗？')) return;
    try {
      await adminCartApi.clearUserCart(userId);
      if (selectedUserId === userId) {
        setCartItems([]);
      }
      fetchUsers();
    } catch (err) {
      alert('清空失败');
    }
  };

  const totalPages = Math.ceil(total / size);

  return (
    <div className={styles.container}>
      <h3 className="fw-bold mb-4">购物车管理</h3>
      <div className="card mb-4 p-3">
        <div className="row g-3">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="搜索用户名/邮箱"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <button className="btn btn-outline-secondary" onClick={() => fetchUsers()}>搜索</button>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-5">
          <div className="card">
            <div className="card-header">用户购物车概览</div>
            <div className="list-group list-group-flush">
              {loading && <div className="text-center p-3">加载中...</div>}
              {users.map(user => (
                <button
                  key={user.user_id}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedUserId === user.user_id ? 'active' : ''}`}
                  onClick={() => setSelectedUserId(user.user_id)}
                >
                  <div>
                    <strong>{user.username}</strong><br />
                    <small>{user.email}</small>
                  </div>
                  <div>
                    <span className="badge bg-primary me-2">商品: {user.total_items}</span>
                    <span className="badge bg-secondary">数量: {user.total_quantity}</span>
                  </div>
                </button>
              ))}
              {users.length === 0 && !loading && <div className="text-center p-3">暂无用户购物车数据</div>}
            </div>
            {totalPages > 1 && (
              <div className="card-footer">
                <nav>
                  <ul className="pagination justify-content-center mb-0">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(p => p-1)}>上一页</button>
                    </li>
                    <li className="page-item active"><span className="page-link">{page}</span></li>
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(p => p+1)}>下一页</button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>

        <div className="col-md-7">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>购物车详情</span>
              {selectedUserId && (
                <button className="btn btn-sm btn-danger" onClick={() => handleClearCart(selectedUserId)}>
                  清空购物车
                </button>
              )}
            </div>
            <div className="card-body">
              {cartLoading && <div className="text-center">加载中...</div>}
              {!cartLoading && cartItems.length === 0 && (
                <div className="text-center text-muted">该用户购物车为空</div>
              )}
              {cartItems.map(item => (
                <div key={item.id} className="d-flex align-items-center border-bottom pb-2 mb-2">
                  <img src={item.product.image_url || 'https://via.placeholder.com/60'} alt={item.product.name} style={{ width: 50, height: 50, objectFit: 'contain', marginRight: 12 }} />
                  <div className="flex-grow-1">
                    <div><strong>{item.product.name}</strong></div>
                    <div>¥{item.product.price} × {item.quantity}</div>
                  </div>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteItem(item.id)}>删除</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carts;