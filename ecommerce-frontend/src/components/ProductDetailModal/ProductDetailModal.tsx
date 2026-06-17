// src/components/ProductDetailModal/ProductDetailModal.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productPublicApi } from '../../api/productPublic';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../Toast';
import type { Product } from '../../types/product';
import styles from './ProductDetailModal.module.css';

interface Props {
  visible: boolean;
  productId: number | null;
  onClose: () => void;
}

const ProductDetailModal = ({ visible, productId, onClose }: Props) => {
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { user } = useAuthStore();
  const toast = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [activeThumb, setActiveThumb] = useState(0);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs'>('desc');
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 200);
  };

  useEffect(() => {
    if (visible && productId) {
      setLoading(true); setError(null);
      productPublicApi.getDetail(productId)
        .then(setProduct).catch(() => setError('加载商品详情失败')).finally(() => setLoading(false));
    } else { setProduct(null); setError(null); setQty(1); setActiveThumb(0); setActiveTab('desc'); setClosing(false); }
  }, [visible, productId]);

  if (!visible) return null;

  const imgUrl = product?.image_url || 'https://via.placeholder.com/600/f5f3ee/9a442d?text=EasyShop';
  const price = Number(product?.price) || 0;

  const handleAddToCart = async () => {
    if (!user) { toast.warning('请先登录'); navigate('/login'); return; }
    if (!product) return;
    try {
      await addToCart({ product_id: product.id, quantity: qty });
      toast.success(`已添加 ${qty} 件到购物车`);
      onClose();
    } catch (e: any) { toast.error(e.response?.data?.detail || '添加失败'); }
  };

  return (
    <div className={`${styles.overlay} ${closing ? styles.closing : ''}`} onClick={handleClose}>
      <div className={`${styles.content} ${closing ? styles.closing : ''}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.breadcrumbs}>
            <a href="/">首页</a><span>/</span><span>{product?.category || '商品'}</span><span>/</span><span style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{product?.name || '详情'}</span>
          </div>
          <button className={styles.closeBtn} onClick={handleClose}><i className="bi bi-x-lg" /></button>
        </div>

        <div className={styles.body}>
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary-container)' }} /></div>
          ) : error ? (
            <div className="alert" style={{ background: 'var(--error-container)', color: 'var(--error)', borderRadius: 'var(--radius)' }}>{error}</div>
          ) : product ? (
            <>
              <div className={styles.grid}>
                {/* Gallery */}
                <div className={styles.gallery}>
                  <img src={activeThumb === 0 ? imgUrl : imgUrl} alt={product.name} className={styles.mainImg} />
                  <div className={styles.thumbGrid}>
                    {[0, 1, 2, 3].map(i => (
                      <img key={i} src={imgUrl} alt="" className={`${styles.thumb} ${activeThumb === i ? styles.thumbActive : ''}`}
                        onClick={() => setActiveThumb(i)} />
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className={styles.info}>
                  <span className={styles.badge}>New Arrival</span>
                  <h1 className={styles.productName}>{product.name}</h1>
                  <div className={styles.stars}>
                    {[1, 2, 3, 4, 5].map(i => <i key={i} className={`bi ${i <= 4 ? 'bi-star-fill' : 'bi-star-half'}`} />)}
                    <span>(128 评价)</span>
                  </div>
                  <div className={styles.price}>¥{price.toFixed(2)}</div>
                  <p className={styles.desc}>{product.description || '精选好物，品质保证。'}</p>

                  <div className={styles.divider} />

                  <div className={styles.qtyRow}>
                    <span className={styles.qtyLabel}>数量</span>
                    <div className={styles.qtyBox}>
                      <button className={styles.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                      <input className={styles.qtyInput} type="number" value={qty} min={1}
                        onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
                      <button className={styles.qtyBtn} onClick={() => setQty(q => q + 1)}>+</button>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button className={styles.buyBtn} onClick={() => { handleAddToCart(); }}>加入购物车</button>
                  </div>

                  <div className={styles.benefits}>
                    <div className={styles.benefit}>
                      <i className="bi bi-truck" />
                      <div><strong>免费配送</strong><span>预计 2-4 天送达</span></div>
                    </div>
                    <div className={styles.benefit}>
                      <i className="bi bi-shield-check" />
                      <div><strong>品质保证</strong><span>官方正品保障</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className={styles.tabs}>
                <button className={`${styles.tab} ${activeTab === 'desc' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('desc')}>产品描述</button>
                <button className={`${styles.tab} ${activeTab === 'specs' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('specs')}>规格参数</button>
              </div>

              <div className={styles.tabContent}>
                {activeTab === 'desc' ? (
                  <div className={styles.featureGrid}>
                    <div className={styles.featureCard}>
                      <i className="bi bi-cpu" />
                      <h4>A17 Pro 芯片</h4>
                      <p>全新级别的 iPhone 芯片，带来前所未有的图形性能。</p>
                    </div>
                    <div className={styles.featureCard}>
                      <i className="bi bi-camera" />
                      <h4>专业相机系统</h4>
                      <p>多个焦段可选，如同随身携带七个专业镜头。</p>
                    </div>
                    <div className={styles.featureCard}>
                      <i className="bi bi-usb-plug" />
                      <h4>USB-C 接口</h4>
                      <p>支持 USB 3，数据传输速度大幅提升。</p>
                    </div>
                  </div>
                ) : (
                  <table className={styles.specTable}>
                    <tbody>
                      <tr><td>商品名称</td><td>{product.name}</td></tr>
                      <tr><td>价格</td><td>¥{price.toFixed(2)}</td></tr>
                      <tr><td>分类</td><td>{product.category || '未分类'}</td></tr>
                      <tr><td>库存</td><td>{product.stock} 件</td></tr>
                      <tr><td>状态</td><td>{product.is_active ? '上架中' : '已下架'}</td></tr>
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
