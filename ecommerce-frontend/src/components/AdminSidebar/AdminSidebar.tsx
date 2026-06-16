// src/components/AdminSidebar/AdminSidebar.tsx
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import styles from './AdminSidebar.module.css';

const menuItems = [
  { path: '/admin', label: '仪表盘', icon: 'bi-speedometer2' },
  { path: '/admin/users', label: '用户管理', icon: 'bi-people' },
  { path: '/admin/products', label: '商品管理', icon: 'bi-box' },
  { path: '/admin/carts', label: '购物车管理', icon: 'bi-cart' },
  { path: '/admin/orders', label: '订单管理', icon: 'bi-receipt' },
];

const AdminSidebar = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <i className={`bi bi-shop ${styles.logoIcon}`}></i>
        <span className={styles.logoText}>EasyShop后台管理</span>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.menuList}>
          {menuItems.map((item) => {
            // 精确匹配当前路径
            const isExactActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`${styles.menuLink} ${isExactActive ? styles.active : ''}`}
                  // 确保 NavLink 不会自动添加任何 active 类
                  // 可设置 end 属性辅助（但已用精确比较，可有可无）
                >
                  <i className={`bi ${item.icon} ${styles.menuIcon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;