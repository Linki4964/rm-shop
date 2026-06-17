// src/components/Header/Header.tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { productPublicApi } from '../../api/productPublic';
import CartDrawer from '../CartDrawer/CartDrawer';
import styles from './Header.module.css';

const Header = () => {
  const { user, logout } = useAuthStore();
  const { totalQuantity, fetchCart } = useCartStore();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get('category') || '';

  useEffect(() => {
    productPublicApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  return (
    <>
      <header className={styles.header}>
        <div className="container d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <Link to="/" className={styles.logo}>EasyShop</Link>
            <nav className={`d-none d-lg-flex ${styles.catNav}`}>
              <button
                className={`${styles.catLink} ${!currentCategory ? styles.catActive : ''}`}
                onClick={() => navigate('/')}
              >
                全部
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`${styles.catLink} ${currentCategory === cat ? styles.catActive : ''}`}
                  onClick={() => navigate(`/?category=${encodeURIComponent(cat)}`)}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </div>
          <div className={styles.navActions}>
            <div className={`${styles.searchBox} d-none d-md-flex`}>
              <i className="bi bi-search" style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem' }} />
              <input className={styles.searchInput} placeholder="搜索产品..." />
            </div>
            <button className={styles.iconBtn} onClick={() => { fetchCart(); setCartDrawerOpen(true); }}>
              <i className="bi bi-cart" style={{ fontSize: '1.1rem' }} />
              {totalQuantity > 0 && <span className={styles.cartBadge}>{totalQuantity}</span>}
            </button>
            <Link to="/orders" className={styles.iconBtn}>
              <i className="bi bi-box" style={{ fontSize: '1.1rem' }} />
            </Link>
            {user ? (
              <>
                <span className="d-none d-md-inline" style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)' }}>
                  {user.full_name || user.username}
                  {user.is_superuser && (
                    <Link to="/admin" className="badge ms-1" style={{ background: 'var(--primary-container)', color: '#fff', fontSize: '0.65rem', textDecoration: 'none' }}>管理</Link>
                  )}
                </span>
                <button className={styles.iconBtn} onClick={logout} title="退出">
                  <i className="bi bi-box-arrow-right" />
                </button>
              </>
            ) : (
              <Link to="/login" className={styles.iconBtn}>
                <i className="bi bi-person" style={{ fontSize: '1.1rem' }} />
                <span className="d-none d-md-inline">登录</span>
              </Link>
            )}
          </div>
        </div>
      </header>
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </>
  );
};

export default Header;
