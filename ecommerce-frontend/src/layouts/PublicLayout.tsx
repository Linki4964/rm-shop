// src/layouts/PublicLayout.tsx
import { useState } from 'react';
import { Outlet, useLocation,useSearchParams  } from 'react-router-dom';
import Header from '../components/Header/Header';
import PublicNavbar from '../components/PublicNavbar/PublicNavbar';
import BannerCarousel from '../components/BannerCarousel/BannerCarousel';
import Footer from '../components/Footer/Footer';
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

  return (
    <div className={styles.layout}>
      <Header />
      <PublicNavbar setActiveCategory={setActiveCategory} />
      {showBanner && <BannerCarousel />}
      <main className={`container ${styles.main}`}>
        <Outlet context={{ activeCategory, setActiveCategory } as CategoryContextType} />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;