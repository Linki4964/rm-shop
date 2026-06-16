import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import HomePage from '../pages/HomePage';
import PublicLayout from '../layouts/PublicLayout';

import Dashboard from '../pages/admin/Dashboard';
import AdminLayout from '../layouts/AdminLayout';
import Products from '../pages/admin/Products';
import Users from '../pages/admin/Users';
import Carts from '../pages/admin/Carts';
import CheckoutPage from '../pages/CheckoutPage';
import OrdersPage from '../pages/OrdersPage';
import Orders from '../pages/admin/Orders';

import PayPage from '../pages/PayPage';
import PaymentReturn from '../pages/PaymentReturn';
// 已登录用户访问登录/注册页时重定向
function GuestRoute() {
  const { token, user } = useAuthStore();
  if (token && user) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
// 需要登录才能访问
function ProtectedRoute() {
  const { token, user, isLoading } = useAuthStore();

  // 无 token，直接去登录
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 正在拉取用户信息，显示加载中
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">加载中...</span>
        </div>
      </div>
    );
  }

  // token 有效但拉取用户失败（user 仍为 null）
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// 需要管理员角色
function AdminRoute() {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <div>Loading...</div>;  // 等待加载
  if (!user?.is_superuser) return <Navigate to="/" replace />;
  return <Outlet />;
}

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
       {/* 公共页面（未登录可访问） */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route path="/payment-return" element={<PaymentReturn />} />
      

        {/* 普通用户页面 */}
         <Route element={<ProtectedRoute />}>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} /> 
            <Route path="/pay" element={<PayPage />} />
            {/* 其他用户页面放这里 */}
          </Route>
        </Route>


        {/* 管理员页面 */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/products" element={<Products />} />   {/* 新增 */}
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/carts" element={<Carts />} />
              <Route path="/admin/orders" element={<Orders />} />
              {/* 其他管理页面放这里 */}
            </Route>
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}; 