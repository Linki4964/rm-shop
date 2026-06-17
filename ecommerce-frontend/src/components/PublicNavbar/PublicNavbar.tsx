// src/components/PublicNavbar/PublicNavbar.tsx
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { productPublicApi } from '../../api/productPublic';
import styles from './PublicNavbar.module.css';

interface PublicNavbarProps {
  setActiveCategory: (cat: string) => void;
}

const PublicNavbar = ({ setActiveCategory }: PublicNavbarProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<string[]>([]);

  const currentCategory = searchParams.get('category') || '';

  useEffect(() => {
    productPublicApi.getCategories()
      .then(setCategories)
      .catch(console.error);
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className="container">
        <ul className={styles.navList}>
          <li>
            <button
              className={`${styles.navLink} ${!currentCategory ? styles.active : ''}`}
              onClick={() => { setActiveCategory(''); navigate('/'); }}
            >
              全部
            </button>
          </li>
          {categories.map(cat => (
            <li key={cat}>
              <button
                className={`${styles.navLink} ${currentCategory === cat ? styles.active : ''}`}
                onClick={() => setActiveCategory(cat === currentCategory ? '' : cat)}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default PublicNavbar;
