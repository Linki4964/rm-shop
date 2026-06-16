// src/components/Header/Header.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import CartDrawer from '../CartDrawer/CartDrawer';
import styles from './Header.module.css';

const Header = () => {
  const { user, logout } = useAuthStore();
  const { totalQuantity, fetchCart } = useCartStore();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const handleCartClick = () => {
    fetchCart();  // 打开时刷新购物车
    setCartDrawerOpen(true);
  };

  return (
    <>
      <header className={`${styles.header} py-2`}>
        <div className="container d-flex justify-content-between align-items-center">
          <Link to="/" className={styles.logo}>
            <img src="/react.svg" alt="Logo" height="40" />
            <span className="ms-2 fw-bold">EasyShop</span>
          </Link>
          <div className="d-flex align-items-center gap-3">
            {/* 购物车图标 */}
            <button className="btn btn-outline-light btn-sm position-relative" onClick={handleCartClick}>
              <i className="bi bi-cart"></i>
              购物车
              {totalQuantity > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {totalQuantity}
                </span>
              )}
            </button>
            <Link to="/orders" className="btn btn-outline-light btn-sm">
            我的订单
            </Link>
            {user ? (
              <>
                <span className="text-light">
                  欢迎，{user.full_name || user.username}
                  {user.is_superuser && (
                    //<span className="badge bg-warning text-dark ms-2">管理员</span>
                    <Link to="/admin" className="badge bg-warning text-dark ms-2 text-decoration-none">管理员</Link>
                  )}
                </span>
                <button className="btn btn-outline-light btn-sm" onClick={logout}>
                  退出
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-light btn-sm">登录</Link>
                <Link to="/register" className="btn btn-light btn-sm">注册</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </>
  );
};

export default Header;