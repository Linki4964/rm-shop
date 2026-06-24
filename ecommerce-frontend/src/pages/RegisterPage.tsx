import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../store/authStore';
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from '../utils/validators';
import styles from './Auth.module.css';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }
    const pwdError = validatePassword(password, true);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    try {
      await register(email, username, password, fullName);
      navigate('/login', { state: { message: '注册成功，请登录' } });
    } catch (err: any) {
      setError(err.response?.data?.detail || '注册失败，请重试');
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.brandSide}>
        <div className={styles.brandGlowOne} />
        <div className={styles.brandGlowTwo} />
        <div className={styles.brandContent}>
          <div className={styles.brandEyebrow}>NEW USER ONBOARDING</div>
          <div className={styles.brandLogo}>
            <span role="img" aria-label="logo">🛒</span>
          </div>
          <h1 className={styles.brandTitle}>EasyShop</h1>
          <p className={styles.brandSubtitle}>创建账号后即可同步收藏、订单和地址信息，保持完整购物记录。</p>

          <div className={styles.brandFeatures}>
            <div className={styles.brandFeature}>
              <i className="bi bi-person-plus" />
              <span>一分钟完成注册，立即进入购物流程</span>
            </div>
            <div className={styles.brandFeature}>
              <i className="bi bi-gift" />
              <span>新账号可直接领取平台活动与优惠券</span>
            </div>
            <div className={styles.brandFeature}>
              <i className="bi bi-heart" />
              <span>收藏、地址、订单统一沉淀在个人中心</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.formSide}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <div className={styles.formEyebrow}>CREATE ACCOUNT</div>
            <h2>创建账号</h2>
            <p>加入 EasyShop，保存你的收藏与订单记录。</p>
          </div>

          {error && (
            <div className={`${styles.alertBox} ${styles.alertError}`}>
              <i className="bi bi-exclamation-triangle-fill" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <i className={`bi bi-envelope ${styles.inputIcon}`} />
              <input
                type="email"
                placeholder="邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <i className={`bi bi-person ${styles.inputIcon}`} />
              <input
                type="text"
                placeholder="用户名（至少 3 位）"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <i className={`bi bi-lock ${styles.inputIcon}`} />
              <input
                type="password"
                placeholder="密码（至少 6 位，需包含字母和数字）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <i className={`bi bi-person-badge ${styles.inputIcon}`} />
              <input
                type="text"
                placeholder="姓名（选填）"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  注册中...
                </>
              ) : (
                '注册'
              )}
            </button>
          </form>

          <div className={styles.formFooter}>
            已有账号？<Link to="/login">去登录</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
