import { useState } from "react";
import type { SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import styles from "./Auth.module.css"; // 统一认证样式
import {
  validateEmail,
  validateUsername,
  validatePassword,
} from "../utils/validators";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

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
    const pwdError = validatePassword(password, true); // required=true
    if (pwdError) {
      setError(pwdError);
      return;
    }

    try {
      await register(email, username, password, fullName);
      navigate("/login", { state: { message: "注册成功，请登录" } });
    } catch (err: any) {
      setError(err.response?.data?.detail || "注册失败，请重试");
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h2 className="text-center mb-4 fw-bold">创建账号</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">邮箱</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <small className="text-muted">至少6位，必须包含字母和数字</small>
          </div>
          <div className="mb-3">
            <label className="form-label">姓名（选填）</label>
            <input
              type="text"
              className="form-control"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-danger w-100 py-2"
            disabled={isLoading}
          >
            {isLoading ? "注册中..." : "注册"}
          </button>
        </form>
        <div className="mt-3 text-center">
          已有账号？{" "}
          <Link to="/login" className="text-danger">
            去登录
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;