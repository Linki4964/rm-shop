import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
    setError('');          // 清空旧错误
    if (submitting) return;
    setSubmitting(true);

    try {
      
      
     
      // 1. 登录获取 token
      await login(username, password);
      // 2. 获取用户信息
      await fetchUser();
      // 3. 跳转到目标页面
      // 从 store 中直接读取最新 user（同步方法）
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
      setError(errorMsg);   // 错误信息会一直显示，不会被清空
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h2 className="text-center mb-4 fw-bold">用户登录</h2>
        {location.state?.message && (
          <div className="alert alert-success">{location.state.message}</div>
        )}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">用户名</label>
            <input type="text" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
          </div>
          <div className="mb-3">
            <label className="form-label">密码</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <button type="submit" className="btn btn-danger w-100 py-2" disabled={submitting} >
            {submitting ? '登录中...' : '登录'}
          </button>
        </form>
        <div className="mt-3 text-center">
          没有账号？ <Link to="/register" className="text-danger">立即注册</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;