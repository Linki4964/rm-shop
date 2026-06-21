// src/pages/CheckoutPage.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { orderApi } from '../api/order';
import { couponApi } from '../api/coupon';
import { addressApi } from '../api/address';
import { useToast } from '../components/Toast';
import type { CouponAvailableItem } from '../api/coupon';
import type { UserAddress } from '../types/address';
import { PROVINCES, CITIES } from '../data/regions';
import styles from './CheckoutPage.module.css';

const DEFAULT_IMAGE = 'https://via.placeholder.com/80/f5f3ee/9a442d?text=EasyShop';
const getPrice = (p: number | string) => Number(p) || 0;
const buildPayUrl = (order: { id: number; order_number: string; total_amount: number | string }) => {
  const params = new URLSearchParams({
    orderId: String(order.id),
    orderNumber: order.order_number,
    totalAmount: String(order.total_amount)
  });
  return `/pay?${params.toString()}`;
};

const PAY_METHODS = [
  { key: 'wechat', icon: 'bi-wallet2', label: '微信支付' },
  { key: 'alipay', icon: 'bi-credit-card', label: '支付宝' },
  { key: 'unionpay', icon: 'bi-bank', label: '银联卡' },
  { key: 'points', icon: 'bi-gift', label: '积分抵扣' },
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, isLoading, fetchCart } = useCartStore();
  const [checkoutItems, setCheckoutItems] = useState(items);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const didSubmitRef = useRef(false);
  const toast = useToast();

  // 地址
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrOpen, setAddrOpen] = useState(false);
  const [selectedAddr, setSelectedAddr] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProvince, setNewProvince] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newDetail, setNewDetail] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [saveAddr, setSaveAddr] = useState(false);
  const [addrErr, setAddrErr] = useState('');

  // 优惠券
  const [coupons, setCoupons] = useState<CouponAvailableItem[]>([]);
  const [couponLoad, setCouponLoad] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponAvailableItem | null>(null);
  const [couponOpen, setCouponOpen] = useState(false);

  // 支付方式（装饰）
  const [payMethod, setPayMethod] = useState('alipay');

  useEffect(() => { fetchCart().finally(() => setCartLoaded(true)); }, [fetchCart]);
  useEffect(() => { if (items.length) setCheckoutItems(items); }, [items]);
  useEffect(() => {
    if (cartLoaded && !isLoading && !submitting && !checkoutItems.length && !didSubmitRef.current) navigate('/');
  }, [cartLoaded, checkoutItems.length, isLoading, navigate, submitting]);

  // 加载地址
  useEffect(() => {
    setAddrLoading(true);
    addressApi.list().then(list => {
      setAddresses(list);
      const def = list.find(a => a.is_default);
      setSelectedAddr(def ? def.id : list[0]?.id || null);
    }).catch(() => {}).finally(() => setAddrLoading(false));
  }, []);

  const totalAmount = checkoutItems.reduce((s, i) => s + getPrice(i.product.price) * i.quantity, 0);
  useEffect(() => {
    if (totalAmount > 0) {
      setCouponLoad(true);
      couponApi.getAvailable(totalAmount, true).then((data) => {
        setCoupons(data);
        setSelectedCoupon((prev) => {
          if (prev) {
            const matched = data.find((item) => item.code === prev.code);
            if (matched?.applicable) return matched;
          }
          const best = [...data]
            .filter((item) => item.applicable)
            .sort((a, b) => b.discount_amount - a.discount_amount)[0];
          return best || null;
        });
      }).catch(() => setCoupons([])).finally(() => setCouponLoad(false));
    }
  }, [totalAmount]);

  const finalAmount = selectedCoupon?.final_amount ?? totalAmount;
  const selAddr = addresses.find(a => a.id === selectedAddr);

  const handleSaveAddr = async () => {
    if (!newProvince || !newCity || !newDetail.trim()) { setAddrErr('请完整填写地址'); return; }
    setSaveAddr(true); setAddrErr('');
    try {
      const c = await addressApi.create({ province: newProvince, city: newCity, detail: newDetail.trim(), recipient_name: newRecipient.trim() || undefined, recipient_phone: newPhone.trim() || undefined });
      setAddresses(p => [...p, c]); setSelectedAddr(c.id); setShowAddModal(false);
      setNewProvince(''); setNewCity(''); setNewDetail(''); setNewRecipient(''); setNewPhone('');
    } catch (e: any) { setAddrErr(e.response?.data?.detail || '保存失败'); }
    finally { setSaveAddr(false); }
  };

  const handleSubmit = async () => {
    if (!selAddr) { setError('请选择收货地址'); return; }
    setSubmitting(true); setError(''); didSubmitRef.current = true;
    const shipping = [selAddr.recipient_name, selAddr.recipient_phone, selAddr.province + selAddr.city + selAddr.detail].filter(Boolean).join('，');
    try {
      const order = await orderApi.create({ shipping_address: shipping, coupon_code: selectedCoupon?.code || undefined });
      sessionStorage.setItem('pending_payment_order', JSON.stringify({
        orderId: order.id,
        orderNumber: order.order_number,
        totalAmount: order.total_amount
      }));
      toast.success('订单创建成功，请完成支付');
      navigate(buildPayUrl(order), {
        state: { orderId: order.id, orderNumber: order.order_number, totalAmount: order.total_amount },
        replace: true,
      });
    } catch (e: any) { didSubmitRef.current = false; setError(e.response?.data?.detail || '创建订单失败'); }
    finally { setSubmitting(false); }
  };

  if (!checkoutItems.length) return <div className={styles.container}><div className="alert" style={{ background: 'var(--error-container)', color: 'var(--error)', borderRadius: 'var(--radius)' }}>购物车为空，无法确认订单。</div></div>;

  return (
    <div className={styles.container}>
      {/* 进度条 */}
      <div className={styles.stepper}>
        <div className={styles.step}>
          <div className={`${styles.stepCircle} ${styles.stepCircleDone}`}>1</div>
          <span className={styles.stepLabel}>购物车</span>
        </div>
        <div className={styles.stepLine} />
        <div className={styles.step}>
          <div className={`${styles.stepCircle} ${styles.stepCircleActive}`}>2</div>
          <span className={`${styles.stepLabel} ${styles.stepLabelActive}`}>确认订单</span>
        </div>
        <div className={styles.stepLine} />
        <div className={styles.step}>
          <div className={`${styles.stepCircle} ${styles.stepCirclePending}`}>3</div>
          <span className={`${styles.stepLabel} ${styles.stepLabelPending}`}>支付完成</span>
        </div>
      </div>

      <div className="row">
        {/* 左侧 */}
        <div className="col-lg-8">
          {/* 商品清单 */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>商品清单 <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 400 }}>共 {checkoutItems.reduce((s,i) => s + i.quantity, 0)} 件</span></div>
            {checkoutItems.map(item => {
              const price = getPrice(item.product.price);
              return (
                <div key={item.id} className={styles.itemRow}>
                  <div className={styles.itemImg}><img src={item.product.image_url || DEFAULT_IMAGE} alt={item.product.name} /></div>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{item.product.name}</div>
                    <div className={styles.itemMeta}>数量：{item.quantity}</div>
                    <div>单价 <b>¥{price.toFixed(2)}</b></div>
                  </div>
                  <div className={styles.itemPrice}>¥{(price * item.quantity).toFixed(2)}</div>
                </div>
              );
            })}
          </div>

          {/* 收货地址 */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              收货地址
              <button className="btn btn-sm" style={{ color: 'var(--secondary)', fontWeight: 600, fontSize: '0.85rem' }} onClick={() => setAddrOpen(!addrOpen)}>
                <i className="bi bi-geo-alt me-1" />管理地址
              </button>
            </div>
            {!addrOpen && selAddr && (
              <div className={`${styles.addrCard} ${styles.addrCardSelected}`}>
                <div>
                  <span className={styles.addrName}>{selAddr.recipient_name || '收件人'} <span style={{ fontWeight: 400, fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>{selAddr.recipient_phone || ''}</span></span>
                  {selAddr.is_default && <span className={styles.addrBadge}>默认</span>}
                </div>
                <div className={styles.addrDetail}>{selAddr.province} {selAddr.city} {selAddr.detail}</div>
                <div className={styles.addrCheck}><i className="bi bi-check-circle-fill" /></div>
              </div>
            )}
            {addrOpen && (
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {addrLoading ? <div className="text-center py-2"><span className="spinner-border spinner-border-sm" /></div> :
                  addresses.map(a => (
                    <div key={a.id} className={`${styles.addrCard} ${selectedAddr === a.id ? styles.addrCardSelected : ''}`}
                      onClick={() => { setSelectedAddr(a.id); setAddrOpen(false); }}>
                      <div>
                        <span className={styles.addrName}>{a.recipient_name || '收件人'} <span style={{ fontWeight: 400, fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>{a.recipient_phone || ''}</span></span>
                        {a.is_default && <span className={styles.addrBadge}>默认</span>}
                      </div>
                      <div className={styles.addrDetail}>{a.province} {a.city} {a.detail}</div>
                      {selectedAddr === a.id && <div className={styles.addrCheck}><i className="bi bi-check-circle-fill" /></div>}
                    </div>
                  ))}
                <div className={`${styles.addrCard}`} style={{ borderStyle: 'dashed' }}
                  onClick={() => { setNewProvince(''); setNewCity(''); setNewDetail(''); setNewRecipient(''); setNewPhone(''); setAddrErr(''); setShowAddModal(true); }}>
                  <i className="bi bi-plus-circle" style={{ color: 'var(--primary-container)' }} /> 添加新地址
                </div>
              </div>
            )}
          </div>

          {/* 支付方式（装饰） */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>支付方式</div>
            <div className={styles.payMethods}>
              {PAY_METHODS.map(m => (
                <button key={m.key} className={`${styles.payBtn} ${payMethod === m.key ? styles.payBtnSelected : ''}`}
                  onClick={() => setPayMethod(m.key)}>
                  <i className={`bi ${m.icon}`} />{m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧摘要 */}
        <div className="col-lg-4">
          <div className={styles.summary}>
            <div className={styles.summaryTitle}>订单信息</div>
            <div className={styles.summaryRow}><span>商品总数</span><span>{checkoutItems.reduce((s,i) => s + i.quantity, 0)} 件</span></div>
            <div className={styles.summaryRow}><span>商品金额</span><span>¥{totalAmount.toFixed(2)}</span></div>
            <div className={styles.summaryRow}><span>运费</span><span style={{ color: 'var(--secondary)' }}>免运费</span></div>

            {/* 优惠券面板按钮 */}
            <div className={styles.summaryRow} style={{ marginTop: '0.25rem' }}>
              <span>优惠券</span>
              <button style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', padding: 0 }}
                onClick={() => setCouponOpen(!couponOpen)}>
                {selectedCoupon ? selectedCoupon.code : '选择优惠券'}
                <i className={`bi bi-chevron-${couponOpen ? 'up' : 'right'} ms-1`} style={{ fontSize: '0.8rem' }} />
              </button>
            </div>
            {couponOpen && (
              <div className="border rounded p-2 mt-1" style={{ background: 'var(--surface-container-low)', borderColor: 'var(--outline-variant)', maxHeight: 180, overflowY: 'auto' }}>
                {couponLoad ? <div className="text-center py-1"><span className="spinner-border spinner-border-sm" /></div> :
                  coupons.length === 0 ? <div className="small text-center py-1" style={{ color: 'var(--on-surface-variant)' }}>暂无可用优惠券</div> :
                  <>
                    <div className={`d-flex align-items-center gap-2 p-2 rounded mb-1 ${!selectedCoupon ? 'fw-bold' : ''}`}
                      style={{ cursor: 'pointer', fontSize: '0.82rem', color: !selectedCoupon ? 'var(--primary)' : 'var(--on-surface-variant)' }}
                      onClick={() => { setSelectedCoupon(null); setCouponOpen(false); }}>
                      <i className={`bi ${!selectedCoupon ? 'bi-check-circle-fill' : 'bi-circle'}`} /> 不使用优惠券
                    </div>
                    {coupons.map(c => (
                      <div key={c.code} className={`d-flex align-items-center gap-2 p-2 rounded mb-1 ${!c.applicable ? 'opacity-50' : ''} ${selectedCoupon?.code === c.code ? 'fw-bold' : ''}`}
                        style={{ cursor: c.applicable ? 'pointer' : 'not-allowed', fontSize: '0.82rem', background: selectedCoupon?.code === c.code ? 'rgba(255,219,210,0.2)' : 'transparent' }}
                        onClick={() => { if (c.applicable) { setSelectedCoupon(c.code === selectedCoupon?.code ? null : c); setCouponOpen(false); } }}>
                        <i className={`bi ${selectedCoupon?.code === c.code ? 'bi-check-circle-fill' : 'bi-circle'}`}
                          style={{ color: selectedCoupon?.code === c.code ? 'var(--primary)' : 'var(--on-surface-variant)' }} />
                        <div className="flex-grow-1">
                          <b>{c.code}</b> <span style={{ color: 'var(--primary)' }}>{c.discount_type === 'percentage' ? `${c.discount_value}%` : `-¥${c.discount_value}`}</span>
                          <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>{c.applicable ? `省 ¥${c.discount_amount}` : c.reason}</div>
                        </div>
                      </div>
                    ))}
                  </>}
              </div>
            )}

            <div className={styles.summaryTotal}>
              <span className={styles.totalLabel}>应付总额</span>
              <div className={styles.totalPrice}>¥{finalAmount.toFixed(2)}</div>
            </div>

            {error && <div className={styles.errorBox}><i className="bi bi-exclamation-triangle me-1" />{error}</div>}

            <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
              {submitting ? '订单处理中...' : '提交订单'}
            </button>

            <div className={styles.trustBadges}>
              <div><i className="bi bi-shield-check" />品质保证</div>
              <div><i className="bi bi-truck" />极速发货</div>
              <div><i className="bi bi-headset" />售后无忧</div>
            </div>
          </div>
        </div>
      </div>

      {/* 新增地址弹窗 */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: 'var(--radius)' }}>
              <div className="modal-header"><h5 className="modal-title">添加新地址</h5><button className="btn-close" onClick={() => setShowAddModal(false)} /></div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-6"><label className="form-label small">收件人</label><input className="form-control form-control-sm" value={newRecipient} onChange={e => setNewRecipient(e.target.value)} /></div>
                  <div className="col-6"><label className="form-label small">电话</label><input className="form-control form-control-sm" value={newPhone} onChange={e => setNewPhone(e.target.value)} /></div>
                </div>
                <div className="mb-3"><label className="form-label small">省 *</label>
                  <select className="form-select form-select-sm" value={newProvince} onChange={e => { setNewProvince(e.target.value); setNewCity(''); }}>
                    <option value="">请选择</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="mb-3"><label className="form-label small">市 *</label>
                  <select className="form-select form-select-sm" value={newCity} onChange={e => setNewCity(e.target.value)} disabled={!newProvince}>
                    <option value="">请选择</option>
                    {(CITIES[newProvince] || []).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="mb-3"><label className="form-label small">详细地址 *</label><textarea className="form-control form-control-sm" rows={2} value={newDetail} onChange={e => setNewDetail(e.target.value)} placeholder="街道、门牌号等" /></div>
                {addrErr && <div className="alert alert-danger small py-1">{addrErr}</div>}
              </div>
              <div className="modal-footer"><button className="btn btn-sm btn-secondary" onClick={() => setShowAddModal(false)}>取消</button><button className="btn btn-sm" style={{ background: 'var(--primary-container)', color: 'var(--on-primary-container)' }} onClick={handleSaveAddr} disabled={saveAddr}>{saveAddr ? '保存中...' : '保存地址'}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
