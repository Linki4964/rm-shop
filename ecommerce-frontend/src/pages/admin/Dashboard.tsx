// src/pages/admin/Dashboard.tsx
import { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import styles from './Dashboard.module.css';
import OrderTrendChart from "../../components/admin/OrderTrendChart";
import TopSellingChart from "../../components/admin/TopSellingChart";

interface Stats {
  users: number;
  products: number;
  orders: number;
  cartItems: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({ users: 0, products: 0, orders: 0, cartItems: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [usersRes, productsRes, ordersRes, cartStatsRes] = await Promise.all([
          apiClient.get('/admin/users/', { params: { page: 1, size: 1 } }),
          apiClient.get('/admin/products/', { params: { page: 1, size: 1 } }),
          apiClient.get('/admin/orders/', { params: { page: 1, size: 1 } }),
          apiClient.get('/admin/carts/stats'),
        ]);
        setStats({
          users: usersRes.data.total || 0,
          products: productsRes.data.total || 0,
          orders: ordersRes.data.total || 0,
          cartItems: cartStatsRes.data.total_quantity || 0,
        });
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-danger" />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <h3 className="fw-bold mb-4">仪表盘</h3>
      <div className="row g-4">
        <div className="col-md-3">
          <div className="card text-white bg-primary shadow">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="card-title">用户总数</h5>
                  <p className="display-6 mb-0">{stats.users}</p>
                </div>
                <i className="bi bi-people fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-success shadow">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="card-title">商品数量</h5>
                  <p className="display-6 mb-0">{stats.products}</p>
                </div>
                <i className="bi bi-box fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-warning shadow">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="card-title">订单数量</h5>
                  <p className="display-6 mb-0">{stats.orders}</p>
                </div>
                <i className="bi bi-receipt fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-info shadow">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="card-title">购物车商品</h5>
                  <p className="display-6 mb-0">{stats.cartItems}</p>
                </div>
                <i className="bi bi-cart fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-6">
            <OrderTrendChart />
          </div>
          <div className="col-md-6">
            <TopSellingChart />
          </div>
        </div>

      </div>
    </div>


    


  );
};

export default Dashboard;