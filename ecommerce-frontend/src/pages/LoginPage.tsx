import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../store/authStore';
import styles from './Auth.module.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, fetchUser } = useAuthStore();

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setError('');
    if (submitting) return;
    setSubmitting(true);

    try {
      await login(username, password);
      await fetchUser();
      const currentUser = useAuthStore.getState().user;
      const from = (location.state as any)?.from?.pathname;

      if (from) {
        navigate(from, { replace: true });
      } else if (currentUser?.is_superuser) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      console.error('登录失败:', err);
      let errorMsg = '登录失败，请检查用户名和密码';
      if (err.response?.data?.detail === 'Incorrect username or password') {
        errorMsg = '用户名或密码错误';
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.brandSide}>
        <div className={styles.brandGlowOne} />
        <div className={styles.brandGlowTwo} />
        <div className={styles.brandContent}>
          <div className={styles.brandEyebrow}>PREMIUM MARKETPLACE</div>
          <div className={styles.brandLogo}>
            <span role="img" aria-label="logo">🛒</span>
          </div>
          <h1 className={styles.brandTitle}>EasyShop</h1>
          <p className={styles.brandSubtitle}>把精选商品、顺滑支付和稳定履约整合到一个更轻盈的购物入口里。</p>

          <div className={styles.brandFeatures}>
            <div className={styles.brandFeature}>
              <i className="bi bi-stars" />
              <span>精选好物，减少低质量选择成本</span>
            </div>
            <div className={styles.brandFeature}>
              <i className="bi bi-shield-check" />
              <span>安全支付链路，订单状态清晰可追踪</span>
            </div>
            <div className={styles.brandFeature}>
              <i className="bi bi-truck" />
              <span>从下单到签收，保持统一体验节奏</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.formSide}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <div className={styles.formEyebrow}>ACCOUNT ACCESS</div>
            <h2>欢迎回来</h2>
            <p>登录你的 EasyShop 账号，继续浏览商品与订单。</p>
          </div>

          {location.state?.message && (
            <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
              <i className="bi bi-check-circle-fill" />
              {location.state.message}
            </div>
          )}

          {error && (
            <div className={`${styles.alertBox} ${styles.alertError}`}>
              <i className="bi bi-exclamation-triangle-fill" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <i className={`bi bi-person ${styles.inputIcon}`} />
              <input
                type="text"
                placeholder="用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className={styles.inputGroup}>
              <i className={`bi bi-lock ${styles.inputIcon}`} />
              <input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>

          <div className={styles.formFooter}>
            还没有账号？<Link to="/register">立即注册</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
