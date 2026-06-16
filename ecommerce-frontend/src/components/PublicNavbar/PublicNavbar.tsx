// src/components/PublicNavbar/PublicNavbar.tsx
import { NavLink } from 'react-router-dom';
import styles from './PublicNavbar.module.css';
import { useState, useEffect } from 'react';
import { productPublicApi } from '../../api/productPublic';

interface PublicNavbarProps {
  setActiveCategory: (cat: string) => void;
}

const PublicNavbar = ({ setActiveCategory }: PublicNavbarProps) => {
  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
  };

  const handleHomeClick = () => {
    setActiveCategory('');
  };

  const [categories, setCategories] = useState<string[]>([]);
  useEffect(() => {
    productPublicApi.getCategories()
      .then(setCategories)
      .catch(console.error);
  }, []);

  return (
    <nav className={`${styles.navbar} navbar navbar-expand-lg`}>
      <div className="container">
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#publicNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="publicNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? styles.active : ''}`} onClick={handleHomeClick}>
                首页
              </NavLink>
            </li>
            {categories.map(cat => (
              <li className="nav-item" key={cat}>
                <NavLink
                  to={`/?category=${encodeURIComponent(cat)}`}
                  className={({ isActive }) => `nav-link ${isActive ? styles.active : ''}`}
                  onClick={() => handleCategoryClick(cat)}
                >
                  {cat}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;