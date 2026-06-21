import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { productPublicApi } from '../../api/productPublic';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useThemeStore } from '../../store/themeStore';
import AddressManageModal from '../AddressManageModal/AddressManageModal';
import CartDrawer from '../CartDrawer/CartDrawer';
import styles from './Header.module.css';

const Header = () => {
  const { user, logout } = useAuthStore();
  const { totalQuantity, fetchCart } = useCartStore();
  const { theme, toggle: toggleTheme } = useThemeStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const currentCategory = searchParams.get('category') || '';

  useEffect(() => {
    productPublicApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setKeyword(searchParams.get('keyword') || '');
  }, [searchParams]);

  const goSearch = () => {
    const next = new URLSearchParams(searchParams);
    if (keyword.trim()) next.set('keyword', keyword.trim());
    else next.delete('keyword');
    navigate(`/?${next.toString()}`);
  };

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
              {categories.map((cat) => (
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
              <input
                className={styles.searchInput}
                placeholder="搜索商品..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') goSearch();
                }}
              />
            </div>
            <button className="btn btn-sm btn-outline-secondary d-none d-md-inline-flex" onClick={goSearch}>搜索</button>
            <button className={styles.iconBtn} onClick={() => { fetchCart(); setCartDrawerOpen(true); }}>
              <i className="bi bi-cart" style={{ fontSize: '1.1rem' }} />
              {totalQuantity > 0 && <span className={styles.cartBadge}>{totalQuantity}</span>}
            </button>
            <button className={styles.iconBtn} onClick={toggleTheme} title={theme === 'light' ? '切换暗色模式' : '切换亮色模式'}>
              <i className={`bi ${theme === 'light' ? 'bi-moon' : 'bi-sun'}`} style={{ fontSize: '1.1rem' }} />
            </button>
            <Link to="/coupon-center" className={styles.iconBtn}>
              <i className="bi bi-ticket-perforated" style={{ fontSize: '1.1rem' }} />
            </Link>
            <Link to="/favorites" className={styles.iconBtn}>
              <i className="bi bi-heart" style={{ fontSize: '1.1rem' }} />
            </Link>
            <Link to="/orders" className={styles.iconBtn}>
              <i className="bi bi-box" style={{ fontSize: '1.1rem' }} />
            </Link>

            {user ? (
              <div className={styles.userMenuWrap}>
                <button className={styles.iconBtn} onClick={() => setUserMenuOpen((prev) => !prev)}>
                  <i className="bi bi-person-circle" style={{ fontSize: '1.1rem' }} />
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
                      <Link to="/profile" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                        <i className="bi bi-person-vcard" /> 个人中心
                      </Link>
                      <Link to="/coupon-center" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                        <i className="bi bi-ticket-perforated" /> 领券中心
                      </Link>
                      <button className={styles.dropdownItem} onClick={() => { setAddrModalOpen(true); setUserMenuOpen(false); }}>
                        <i className="bi bi-geo-alt" /> 管理地址
                      </button>
                      {user.is_superuser && (
                        <Link to="/admin" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                          <i className="bi bi-speedometer2" /> 管理后台
                        </Link>
                      )}
                      <button className={styles.dropdownItem} onClick={() => { logout(); setUserMenuOpen(false); navigate('/login', { replace: true }); }}>
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
