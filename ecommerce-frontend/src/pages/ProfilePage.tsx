import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { addressApi } from '../api/address';
import { couponApi, type UserCouponItem } from '../api/coupon';
import { favoriteApi, type FavoriteItem } from '../api/favorite';
import { orderApi } from '../api/order';
import { userProfileApi } from '../api/userProfile';
import { useToast } from '../components/Toast';
import { useAuthStore } from '../store/authStore';
import type { UserAddress } from '../types/address';
import type { Order } from '../types/order';

const tabs = [
  { key: 'profile', label: '个人资料' },
  { key: 'address', label: '地址管理' },
  { key: 'orders', label: '我的订单' },
  { key: 'favorites', label: '收藏宝贝' },
  { key: 'coupons', label: '我的优惠券' },
];

const ProfilePage = () => {
  const { user, fetchUser } = useAuthStore();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const [profileForm, setProfileForm] = useState({ email: '', username: '', full_name: '', password: '' });
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
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
        const [addressRes, orderRes, favoriteRes, couponRes] = await Promise.all([
          addressApi.list(),
          orderApi.list(),
          favoriteApi.list(),
          couponApi.mine(),
        ]);
        setAddresses(addressRes);
        setOrders(orderRes.items);
        setFavorites(favoriteRes);
        setCoupons(couponRes);
      } catch {
        toast.error('个人中心数据加载失败');
      }
    };
    load();
  }, [toast]);

  const summary = useMemo(() => ({
    orders: orders.length,
    favorites: favorites.length,
    coupons: coupons.filter((item) => item.status === 'claimed').length,
    addresses: addresses.length,
  }), [orders, favorites, coupons, addresses]);

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
    <div className="row g-4">
      <div className="col-lg-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="text-center mb-4">
              <div className="rounded-circle bg-danger-subtle d-inline-flex align-items-center justify-content-center" style={{ width: 72, height: 72 }}>
                <i className="bi bi-person-fill fs-2 text-danger" />
              </div>
              <h4 className="mt-3 mb-1">{user?.full_name || user?.username}</h4>
              <div className="text-muted small">{user?.email}</div>
            </div>
            <div className="row g-2 text-center mb-4">
              <div className="col-6"><div className="border rounded p-2"><div className="fw-bold">{summary.orders}</div><div className="small text-muted">订单</div></div></div>
              <div className="col-6"><div className="border rounded p-2"><div className="fw-bold">{summary.favorites}</div><div className="small text-muted">收藏</div></div></div>
              <div className="col-6"><div className="border rounded p-2"><div className="fw-bold">{summary.coupons}</div><div className="small text-muted">可用券</div></div></div>
              <div className="col-6"><div className="border rounded p-2"><div className="fw-bold">{summary.addresses}</div><div className="small text-muted">地址</div></div></div>
            </div>
            <div className="list-group">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`list-group-item list-group-item-action ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => updateTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-9">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            {activeTab === 'profile' && (
              <>
                <h4 className="fw-bold mb-4">个人资料</h4>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">邮箱</label>
                    <input className="form-control" value={profileForm.email} onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">用户名</label>
                    <input className="form-control" value={profileForm.username} onChange={(e) => setProfileForm((prev) => ({ ...prev, username: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">姓名</label>
                    <input className="form-control" value={profileForm.full_name} onChange={(e) => setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">新密码</label>
                    <input type="password" className="form-control" value={profileForm.password} onChange={(e) => setProfileForm((prev) => ({ ...prev, password: e.target.value }))} />
                  </div>
                </div>
                <button className="btn btn-danger mt-4" onClick={handleSaveProfile}>保存资料</button>
              </>
            )}

            {activeTab === 'address' && (
              <>
                <h4 className="fw-bold mb-4">地址管理</h4>
                <div className="row g-3 mb-4">
                  <div className="col-md-3"><input className="form-control" placeholder="省份" value={newAddress.province} onChange={(e) => setNewAddress((prev) => ({ ...prev, province: e.target.value }))} /></div>
                  <div className="col-md-3"><input className="form-control" placeholder="城市" value={newAddress.city} onChange={(e) => setNewAddress((prev) => ({ ...prev, city: e.target.value }))} /></div>
                  <div className="col-md-6"><input className="form-control" placeholder="详细地址" value={newAddress.detail} onChange={(e) => setNewAddress((prev) => ({ ...prev, detail: e.target.value }))} /></div>
                  <div className="col-md-3"><input className="form-control" placeholder="收件人" value={newAddress.recipient_name} onChange={(e) => setNewAddress((prev) => ({ ...prev, recipient_name: e.target.value }))} /></div>
                  <div className="col-md-3"><input className="form-control" placeholder="电话" value={newAddress.recipient_phone} onChange={(e) => setNewAddress((prev) => ({ ...prev, recipient_phone: e.target.value }))} /></div>
                  <div className="col-md-3 d-flex align-items-center"><div className="form-check"><input className="form-check-input" type="checkbox" checked={newAddress.is_default} onChange={(e) => setNewAddress((prev) => ({ ...prev, is_default: e.target.checked }))} /><label className="form-check-label">设为默认</label></div></div>
                  <div className="col-md-3"><button className="btn btn-danger w-100" onClick={handleAddAddress}>新增地址</button></div>
                </div>
                <div className="row g-3">
                  {addresses.map((address) => (
                    <div key={address.id} className="col-md-6">
                      <div className="border rounded p-3 h-100">
                        <div className="d-flex justify-content-between">
                          <div className="fw-bold">{address.recipient_name || '未填写收件人'}</div>
                          {address.is_default && <span className="badge bg-success">默认</span>}
                        </div>
                        <div className="text-muted small mb-2">{address.recipient_phone || '未填写电话'}</div>
                        <div>{address.province} {address.city} {address.detail}</div>
                        <button className="btn btn-sm btn-outline-danger mt-3" onClick={() => handleDeleteAddress(address.id)}>删除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'orders' && (
              <>
                <h4 className="fw-bold mb-4">我的订单</h4>
                {orders.map((order) => (
                  <div key={order.id} className="border rounded p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <div className="fw-bold">{order.order_number}</div>
                        <div className="small text-muted">{new Date(order.created_at).toLocaleString()}</div>
                      </div>
                      <span className="badge bg-secondary">{order.status}</span>
                    </div>
                    <div className="small text-muted mb-2">{order.shipping_address}</div>
                    <div>共 {order.items.length} 件商品，实付 ￥{Number(order.total_amount).toFixed(2)}</div>
                  </div>
                ))}
              </>
            )}

            {activeTab === 'favorites' && (
              <>
                <h4 className="fw-bold mb-4">收藏宝贝</h4>
                <div className="row g-3">
                  {favorites.map((item) => (
                    item.product ? (
                      <div key={item.id} className="col-md-4">
                        <div className="border rounded p-3 h-100">
                          <img src={item.product.image_url || '/homepage.jpg'} alt={item.product.name} className="img-fluid rounded mb-3" />
                          <div className="fw-bold">{item.product.name}</div>
                          <div className="text-danger fw-bold mt-2">￥{Number(item.product.price).toFixed(2)}</div>
                        </div>
                      </div>
                    ) : null
                  ))}
                </div>
              </>
            )}

            {activeTab === 'coupons' && (
              <>
                <h4 className="fw-bold mb-4">我的优惠券</h4>
                <div className="row g-3">
                  {coupons.map((item) => (
                    <div key={item.id} className="col-md-6">
                      <div className="border rounded p-3 h-100">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <div className="fw-bold fs-5">{item.coupon.code}</div>
                            <div className="small text-muted">领取于 {new Date(item.claimed_at).toLocaleDateString()}</div>
                          </div>
                          <span className={`badge ${item.status === 'claimed' ? 'bg-success' : 'bg-secondary'}`}>
                            {item.status === 'claimed' ? '可使用' : '已使用'}
                          </span>
                        </div>
                        <div className="text-danger fw-bold mb-2">
                          {item.coupon.discount_type === 'percentage' ? `${item.coupon.discount_value}% OFF` : `￥${item.coupon.discount_value}`}
                        </div>
                        <div className="text-muted">满 ￥{item.coupon.min_order_amount} 可用</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
