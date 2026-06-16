// src/pages/admin/Users.tsx
import { useEffect, useState, useCallback } from 'react';
import { userAdminApi } from '../../api/userAdmin';
import type { User, UserSearchParams } from '../../types/user';
import UserFormModal from '../../components/UserFormModal/UserFormModal';
import styles from './Users.module.css';

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(''); // '' all, 'active', 'inactive'
  const [roleFilter, setRoleFilter] = useState<string>('');     // '' all, 'admin', 'user'

  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: UserSearchParams = {
        page,
        size,
        keyword: keyword || undefined,
        is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
        is_superuser: roleFilter === 'admin' ? true : roleFilter === 'user' ? false : undefined,
        sort_by: 'created_at',
        sort_order: 'desc',
      };
      const res = await userAdminApi.list(params);
      setUsers(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
      alert('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, size, keyword, statusFilter, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除该用户吗？')) return;
    try {
      await userAdminApi.delete(id);
      fetchUsers();
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await userAdminApi.toggleStatus(id, !currentStatus);
      fetchUsers();
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setModalVisible(true);
  };

  const handleModalClose = (refetch = false) => {
    setModalVisible(false);
    setEditingUser(null);
    if (refetch) fetchUsers();
  };

  const totalPages = Math.ceil(total / size);

  return (
    <div className={styles.container}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold">用户管理</h3>
        <button
          className="btn btn-danger"
          onClick={() => {
            setEditingUser(null);
            setModalVisible(true);
          }}
        >
          + 新增用户
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="card mb-4 p-3">
        <div className="row g-3">
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="用户名/邮箱/姓名"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="active">启用</option>
              <option value="inactive">禁用</option>
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">全部角色</option>
              <option value="admin">管理员</option>
              <option value="user">普通用户</option>
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn btn-outline-secondary w-100" onClick={() => fetchUsers()}>
              搜索
            </button>
          </div>
        </div>
      </div>

      {/* 用户表格 */}
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
                  <th>用户名</th>
                  <th>邮箱</th>
                  <th>姓名</th>
                  <th>状态</th>
                  <th>角色</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.full_name || '-'}</td>
                    <td>
                      <span className={`badge ${user.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {user.is_active ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.is_superuser ? 'bg-danger' : 'bg-info'}`}>
                        {user.is_superuser ? '管理员' : '普通用户'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => handleEdit(user)}
                      >
                        编辑
                      </button>
                      <button
                        className="btn btn-sm btn-outline-warning me-1"
                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                      >
                        {user.is_active ? '禁用' : '启用'}
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(user.id)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted">暂无用户数据</td>
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

      <UserFormModal
        visible={modalVisible}
        onClose={handleModalClose}
        user={editingUser}
      />
    </div>
  );
};

export default Users;