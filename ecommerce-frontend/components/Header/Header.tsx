import styles from './Header.module.css';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuthStore();
  return (
    <header className={`${styles.header} py-2`}>
      <div className="container d-flex justify-content-between align-items-center">
        <Link to="/" className={styles.logo}>
          <img src="/logo.png" alt="Logo" height="40" />
          <span className="ms-2 fw-bold">EasyShop</span>
        </Link>
        <div className="d-flex align-items-center gap-3">
          {user ? (
            <>
              <span className="text-light">
                欢迎，{user.full_name || user.username}
                {user.is_superuser && (
                  <span className="badge bg-warning text-dark ms-2">管理员</span>
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
  );
};

export default Header;