// src/pages/admin/Dashboard.tsx
import { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import OrderTrendChart from '../../components/admin/OrderTrendChart';
import TopSellingChart from '../../components/admin/TopSellingChart';
import styles from './Dashboard.module.css';

interface Stats {
  users: number;
  products: number;
  orders: number;
  revenue: number;
}

const STAT_CARDS = [
  { key: 'users' as const, label: '用户总数', icon: 'bi-people', color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
  { key: 'products' as const, label: '商品数量', icon: 'bi-box', color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
  { key: 'orders' as const, label: '订单数量', icon: 'bi-receipt', color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
  { key: 'revenue' as const, label: '成交金额', icon: 'bi-currency-dollar', color: '#0891b2', bg: 'rgba(8,145,178,0.08)', format: true },
];

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({ users: 0, products: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [usersRes, productsRes, ordersRes, revenueRes] = await Promise.all([
          apiClient.get('/admin/users/', { params: { page: 1, size: 1 } }),
          apiClient.get('/admin/products/', { params: { page: 1, size: 1 } }),
          apiClient.get('/admin/orders/', { params: { page: 1, size: 1 } }),
          apiClient.get('/admin/stats/revenue'),
        ]);
        setStats({
          users: usersRes.data.total || 0,
          products: productsRes.data.total || 0,
          orders: ordersRes.data.total || 0,
          revenue: revenueRes.data.revenue || 0,
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
        <div className="spinner-border" style={{ color: 'var(--primary-container)' }} />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <h3 className="fw-bold mb-4" style={{ fontFamily: '"Manrope","Noto Sans SC",sans-serif' }}>仪表盘</h3>

      {/* 统计卡片 */}
      <div className="row g-3 mb-4">
        {STAT_CARDS.map(card => (
          <div className="col-md-3" key={card.key}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: card.bg, color: card.color }}>
                <i className={`bi ${card.icon}`} />
              </div>
              <div className={styles.statBody}>
                <div className={styles.statValue}>
                  {card.format ? `¥${stats[card.key].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : stats[card.key].toLocaleString()}
                </div>
                <div className={styles.statLabel}>{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 图表 */}
      <div className="row g-3">
        <div className="col-md-6">
          <div className={styles.chartCard}>
            <OrderTrendChart />
          </div>
        </div>
        <div className="col-md-6">
          <div className={styles.chartCard}>
            <TopSellingChart />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
