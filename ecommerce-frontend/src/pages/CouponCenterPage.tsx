import { useEffect, useState } from 'react';

import { couponApi, type CouponAvailableItem } from '../api/coupon';
import { useToast } from '../components/Toast';

const CouponCenterPage = () => {
  const [coupons, setCoupons] = useState<CouponAvailableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const loadCoupons = async () => {
    setLoading(true);
    try {
      setCoupons(await couponApi.getAvailable(0, false));
    } catch {
      toast.error('加载优惠券失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleClaim = async (couponId: number) => {
    try {
      await couponApi.claim(couponId);
      toast.success('领取成功');
      await loadCoupons();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '领取失败');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">领券中心</h3>
          <div className="text-muted">优惠券由管理员统一发放和管理，领取后可在结算页自动匹配。</div>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-danger" /></div>
      ) : (
        <div className="row g-4">
          {coupons.map((coupon) => (
            <div key={coupon.coupon_id} className="col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <div className="small text-muted">券码</div>
                      <div className="fw-bold fs-5">{coupon.code}</div>
                    </div>
                    <span className={`badge ${coupon.is_claimed ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {coupon.is_claimed ? '已领取' : '可领取'}
                    </span>
                  </div>
                  <div className="display-6 text-danger fw-bold mb-2">
                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `￥${coupon.discount_value}`}
                  </div>
                  <div className="text-muted mb-1">满 ￥{coupon.min_order_amount} 可用</div>
                  <div className="text-muted mb-4">有效期：{coupon.expires_at || '长期有效'}</div>
                  <button
                    className="btn btn-danger mt-auto"
                    disabled={coupon.is_claimed}
                    onClick={() => handleClaim(coupon.coupon_id)}
                  >
                    {coupon.is_claimed ? '已领取' : '立即领取'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {coupons.length === 0 && <div className="text-center text-muted py-5">当前没有可领取的优惠券</div>}
        </div>
      )}
    </div>
  );
};

export default CouponCenterPage;
