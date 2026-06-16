// src/layouts/PublicLayout.tsx
import { useState } from 'react';
import { Outlet, useLocation, useSearchParams, NavLink } from 'react-router-dom';
import Header from '../components/Header/Header';
import PublicNavbar from '../components/PublicNavbar/PublicNavbar';
import BannerCarousel from '../components/BannerCarousel/BannerCarousel';
import Footer from '../components/Footer/Footer';
import navbarStyles from '../components/PublicNavbar/PublicNavbar.module.css';
import styles from './PublicLayout.module.css';

export type CategoryContextType = {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
};

const PublicLayout = () => {
  const [activeCategory, setActiveCategory] = useState('');

  const location = useLocation();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  // 只有首页且没有分类参数时才显示轮播
  const showBanner = location.pathname === '/' && !category;
  // 订单、结算、支付页面使用简化导航栏，只显示"返回首页"
  const isSimpleNav = location.pathname === '/orders' || location.pathname === '/checkout' || location.pathname === '/pay';

  return (
    <div className={styles.layout}>
      <Header />
      {isSimpleNav ? (
        <nav className={`${navbarStyles.navbar} navbar navbar-expand`}>
          <div className="container">
            <ul className="navbar-nav">
              <li className="nav-item">
                <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? navbarStyles.active : ''}`}>
                  返回首页
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>
      ) : (
        <PublicNavbar setActiveCategory={setActiveCategory} />
      )}
      {showBanner && <BannerCarousel />}
      <main className={`container ${styles.main}`}>
        <Outlet context={{ activeCategory, setActiveCategory } as CategoryContextType} />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;