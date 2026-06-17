// src/layouts/PublicLayout.tsx
import { useState } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import Header from '../components/Header/Header';
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

  const showBanner = location.pathname === '/';
  const isSimpleNav = location.pathname !== '/';

  return (
    <div className={styles.layout}>
      <Header />
      {isSimpleNav && (
        <nav className={navbarStyles.navbar}>
          <div className="container">
            <NavLink to="/" className={navbarStyles.backBtn}>
              <i className="bi bi-arrow-left" /> 返回首页
            </NavLink>
          </div>
        </nav>
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