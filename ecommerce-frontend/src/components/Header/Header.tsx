// src/components/Header/Header.tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { productPublicApi } from '../../api/productPublic';
import CartDrawer from '../CartDrawer/CartDrawer';
import AddressManageModal from '../AddressManageModal/AddressManageModal';
import { useThemeStore } from '../../store/themeStore';
import styles from './Header.module.css';

const Header = () => {
  const { user, logout } = useAuthStore();
  const { totalQuantity, fetchCart } = useCartStore();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get('category') || '';
  const { theme, toggle: toggleTheme } = useThemeStore();

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
            <button className={styles.iconBtn} onClick={toggleTheme} title={theme === 'light' ? '切换暗色模式' : '切换亮色模式'}>
              <i className={`bi ${theme === 'light' ? 'bi-moon' : 'bi-sun'}`} style={{ fontSize: '1.1rem' }} />
            </button>
            <Link to="/favorites" className={styles.iconBtn}>
              <i className="bi bi-heart" style={{ fontSize: '1.1rem' }} />
            </Link>
            <Link to="/orders" className={styles.iconBtn}>
              <i className="bi bi-box" style={{ fontSize: '1.1rem' }} />
            </Link>
            {user ? (
              <div className={styles.userMenuWrap}>
                <button className={styles.iconBtn} onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  <i className="bi bi-person" style={{ fontSize: '1.1rem' }} />
                  <span className="d-none d-md-inline">{user.full_name || user.username}</span>
                </button>
                {userMenuOpen && (
                  <>
                    <div className={styles.dropdownOverlay} onClick={() => setUserMenuOpen(false)} />
                    <div className={styles.dropdown}>
                      <div className={styles.dropdownUser}>
                        <strong>{user.full_name || user.username}</strong>
                        <span>{user.email}</span>
                      </div>
                      <button className={styles.dropdownItem} onClick={() => { setUserMenuOpen(false); logout(); navigate('/login', { replace: true }); }}>
                        <i className="bi bi-arrow-repeat" /> 切换账号
                      </button>
                      <button className={styles.dropdownItem} onClick={() => { setAddrModalOpen(true); setUserMenuOpen(false); }}>
                        <i className="bi bi-geo-alt" /> 管理地址
                      </button>
                      {user.is_superuser && (
                        <Link to="/admin" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                          <i className="bi bi-speedometer2" /> 管理后台
                        </Link>
                      )}
                      <button className={styles.dropdownItem} onClick={() => { logout(); setUserMenuOpen(false); }}>
                        <i className="bi bi-box-arrow-right" /> 退出登录
                      </button>
                    </div>
                  </>
                )}
              </div>
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
      <AddressManageModal visible={addrModalOpen} onClose={() => setAddrModalOpen(false)} />
    </>
  );
};

export default Header;
