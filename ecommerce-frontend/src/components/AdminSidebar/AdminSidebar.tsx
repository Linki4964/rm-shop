import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../store/authStore';
import styles from './AdminSidebar.module.css';

const menuItems = [
  { path: '/admin', label: '仪表盘', icon: 'bi-speedometer2' },
  { path: '/admin/users', label: '用户管理', icon: 'bi-people' },
  { path: '/admin/products', label: '商品管理', icon: 'bi-box' },
  { path: '/admin/coupons', label: '优惠券管理', icon: 'bi-ticket-perforated' },
  { path: '/admin/carts', label: '购物车管理', icon: 'bi-cart' },
  { path: '/admin/orders', label: '订单管理', icon: 'bi-receipt' },
];

const AdminSidebar = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <i className={`bi bi-shop ${styles.logoIcon}`}></i>
        <span className={styles.logoText}>EasyShop 后台管理</span>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.menuList}>
          {menuItems.map((item) => {
            const isExactActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`${styles.menuLink} ${isExactActive ? styles.active : ''}`}
                >
                  <i className={`bi ${item.icon} ${styles.menuIcon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.footer}>
        <span className={styles.userInfo}>{user?.username}</span>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <i className="bi bi-box-arrow-right" /> 退出登录
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
