import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { addressApi } from '../api/address';
import { couponApi, type UserCouponItem } from '../api/coupon';
import { favoriteApi } from '../api/favorite';
import FavoritesPanel from '../components/FavoritesPanel/FavoritesPanel';
import OrdersPanel from '../components/OrdersPanel/OrdersPanel';
import { useToast } from '../components/Toast';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { userProfileApi } from '../api/userProfile';
import type { UserAddress } from '../types/address';
import styles from './ProfilePage.module.css';

const tabs = [
  { key: 'profile', label: '个人资料', icon: 'bi-person-vcard' },
  { key: 'address', label: '地址管理', icon: 'bi-geo-alt' },
  { key: 'orders', label: '我的订单', icon: 'bi-box-seam' },
  { key: 'favorites', label: '收藏宝贝', icon: 'bi-heart' },
  { key: 'coupons', label: '我的优惠券', icon: 'bi-ticket-perforated' },
];

const ProfilePage = () => {
  const { user, fetchUser } = useAuthStore();
  const { orders, fetchOrders } = useOrderStore();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const [profileForm, setProfileForm] = useState({ email: '', username: '', full_name: '', password: '' });
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [coupons, setCoupons] = useState<UserCouponItem[]>([]);
  const [newAddress, setNewAddress] = useState({ province: '', city: '', detail: '', recipient_name: '', recipient_phone: '', is_default: false });

  useEffect(() => {
    if (user) {
      setProfileForm({
        email: user.email,
        username: user.username,
        full_name: user.full_name || '',
        password: '',
      });
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const [addressRes, favoriteRes, couponRes] = await Promise.all([
          addressApi.list(),
          favoriteApi.list(),
          couponApi.mine(),
          fetchOrders(),
        ]);
        setAddresses(addressRes);
        setFavoritesCount(favoriteRes.length);
        setCoupons(couponRes);
      } catch {
        toast.error('个人中心数据加载失败');
      }
    };

    load();
  }, [fetchOrders, toast]);

  const summary = useMemo(() => ({
    orders: orders.length,
    favorites: favoritesCount,
    coupons: coupons.filter((item) => item.status === 'claimed').length,
    addresses: addresses.length,
  }), [orders, favoritesCount, coupons, addresses]);

  const updateTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next);
  };

  const handleSaveProfile = async () => {
    try {
      await userProfileApi.update({
        email: profileForm.email,
        username: profileForm.username,
        full_name: profileForm.full_name,
        password: profileForm.password || undefined,
      });
      await fetchUser();
      setProfileForm((prev) => ({ ...prev, password: '' }));
      toast.success('资料已更新');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '更新失败');
    }
  };

  const handleAddAddress = async () => {
    try {
      await addressApi.create(newAddress);
      setAddresses(await addressApi.list());
      setNewAddress({ province: '', city: '', detail: '', recipient_name: '', recipient_phone: '', is_default: false });
      toast.success('地址已新增');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '新增地址失败');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      await addressApi.delete(id);
      setAddresses(await addressApi.list());
      toast.success('地址已删除');
    } catch {
      toast.error('删除地址失败');
    }
  };

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <section className={styles.profileCard}>
          <div className={styles.avatar}>
            <i className="bi bi-person-fill" />
          </div>
          <h2>{user?.full_name || user?.username}</h2>
          <p>{user?.email}</p>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <strong>{summary.orders}</strong>
              <span>订单</span>
            </div>
            <div className={styles.summaryItem}>
              <strong>{summary.favorites}</strong>
              <span>收藏</span>
            </div>
            <div className={styles.summaryItem}>
              <strong>{summary.coupons}</strong>
              <span>可用券</span>
            </div>
            <div className={styles.summaryItem}>
              <strong>{summary.addresses}</strong>
              <span>地址</span>
            </div>
          </div>

          <div className={styles.tabList}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`${styles.tabButton} ${activeTab === tab.key ? styles.tabButtonActive : ''}`}
                onClick={() => updateTab(tab.key)}
              >
                <i className={`bi ${tab.icon}`} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </section>
      </aside>

      <section className={styles.contentCard}>
        {activeTab === 'profile' && (
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>个人资料</h3>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>邮箱</span>
                <input className={`form-control ${styles.control}`} value={profileForm.email} onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))} />
              </label>
              <label className={styles.field}>
                <span>用户名</span>
                <input className={`form-control ${styles.control}`} value={profileForm.username} onChange={(e) => setProfileForm((prev) => ({ ...prev, username: e.target.value }))} />
              </label>
              <label className={styles.field}>
                <span>姓名</span>
                <input className={`form-control ${styles.control}`} value={profileForm.full_name} onChange={(e) => setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))} />
              </label>
              <label className={styles.field}>
                <span>新密码</span>
                <input type="password" className={`form-control ${styles.control}`} value={profileForm.password} onChange={(e) => setProfileForm((prev) => ({ ...prev, password: e.target.value }))} />
              </label>
            </div>
            <button className={`btn btn-danger ${styles.primaryButton}`} onClick={handleSaveProfile}>保存资料</button>
          </div>
        )}

        {activeTab === 'address' && (
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>地址管理</h3>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>省份</span>
                <input className={`form-control ${styles.control}`} value={newAddress.province} onChange={(e) => setNewAddress((prev) => ({ ...prev, province: e.target.value }))} />
              </label>
              <label className={styles.field}>
                <span>城市</span>
                <input className={`form-control ${styles.control}`} value={newAddress.city} onChange={(e) => setNewAddress((prev) => ({ ...prev, city: e.target.value }))} />
              </label>
              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span>详细地址</span>
                <input className={`form-control ${styles.control}`} value={newAddress.detail} onChange={(e) => setNewAddress((prev) => ({ ...prev, detail: e.target.value }))} />
              </label>
              <label className={styles.field}>
                <span>收件人</span>
                <input className={`form-control ${styles.control}`} value={newAddress.recipient_name} onChange={(e) => setNewAddress((prev) => ({ ...prev, recipient_name: e.target.value }))} />
              </label>
              <label className={styles.field}>
                <span>电话</span>
                <input className={`form-control ${styles.control}`} value={newAddress.recipient_phone} onChange={(e) => setNewAddress((prev) => ({ ...prev, recipient_phone: e.target.value }))} />
              </label>
            </div>
            <div className={styles.addressActions}>
              <label className={styles.checkboxRow}>
                <input type="checkbox" checked={newAddress.is_default} onChange={(e) => setNewAddress((prev) => ({ ...prev, is_default: e.target.checked }))} />
                <span>设为默认地址</span>
              </label>
              <button className={`btn btn-danger ${styles.primaryButton}`} onClick={handleAddAddress}>新增地址</button>
            </div>

            <div className={styles.addressGrid}>
              {addresses.map((address) => (
                <article key={address.id} className={styles.addressCard}>
                  <div className={styles.addressHeader}>
                    <strong>{address.recipient_name || '未填写收件人'}</strong>
                    {address.is_default && <span className={styles.addressBadge}>默认</span>}
                  </div>
                  <p>{address.recipient_phone || '未填写电话'}</p>
                  <div>{address.province} {address.city} {address.detail}</div>
                  <button className={`btn btn-outline-danger btn-sm ${styles.pillButton}`} onClick={() => handleDeleteAddress(address.id)}>删除</button>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className={styles.sectionBlock}>
            <OrdersPanel autoFetch={false} embedded showTitle={false} />
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className={styles.sectionBlock}>
            <FavoritesPanel embedded showTitle={false} />
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>我的优惠券</h3>
            <div className={styles.couponGrid}>
              {coupons.map((item) => (
                <article key={item.id} className={styles.couponCard}>
                  <div className={styles.couponTop}>
                    <div>
                      <strong>{item.coupon.code}</strong>
                      <p>领取于 {new Date(item.claimed_at).toLocaleDateString()}</p>
                    </div>
                    <span className={item.status === 'claimed' ? styles.couponBadgeActive : styles.couponBadgeUsed}>
                      {item.status === 'claimed' ? '可使用' : '已使用'}
                    </span>
                  </div>
                  <div className={styles.couponValue}>
                    {item.coupon.discount_type === 'percentage' ? `${item.coupon.discount_value}% OFF` : `¥${item.coupon.discount_value}`}
                  </div>
                  <div className={styles.couponHint}>满 ¥{item.coupon.min_order_amount} 可用</div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProfilePage;
