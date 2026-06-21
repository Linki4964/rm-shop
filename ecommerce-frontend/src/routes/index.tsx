import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';

import AdminLayout from '../layouts/AdminLayout';
import PublicLayout from '../layouts/PublicLayout';
import { useAuthStore } from '../store/authStore';
import CheckoutPage from '../pages/CheckoutPage';
import CouponCenterPage from '../pages/CouponCenterPage';
import FavoritesPage from '../pages/FavoritesPage';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import OrdersPage from '../pages/OrdersPage';
import PayPage from '../pages/PayPage';
import PaymentReturn from '../pages/PaymentReturn';
import ProfilePage from '../pages/ProfilePage';
import RegisterPage from '../pages/RegisterPage';
import Dashboard from '../pages/admin/Dashboard';
import Products from '../pages/admin/Products';
import Users from '../pages/admin/Users';
import Carts from '../pages/admin/Carts';
import Orders from '../pages/admin/Orders';
import Coupons from '../pages/admin/Coupons';

function GuestRoute() {
  const { token, user } = useAuthStore();
  if (token && user) {
    return <Navigate to={user.is_superuser ? '/admin' : '/'} replace />;
  }
  return <Outlet />;
}

function ProtectedRoute() {
  const { token, user, isLoading } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-danger" role="status" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function StorefrontRoute() {
  const { user } = useAuthStore();
  if (user?.is_superuser) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

function AdminRoute() {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <div>Loading...</div>;
  if (!user?.is_superuser) return <Navigate to="/" replace />;
  return <Outlet />;
}

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route path="/payment-return" element={<PaymentReturn />} />

        <Route element={<StorefrontRoute />}>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<StorefrontRoute />}>
            <Route element={<PublicLayout />}>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/pay" element={<PayPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/coupon-center" element={<CouponCenterPage />} />
            </Route>
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/products" element={<Products />} />
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/carts" element={<Carts />} />
              <Route path="/admin/orders" element={<Orders />} />
              <Route path="/admin/coupons" element={<Coupons />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
