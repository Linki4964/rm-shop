// src/components/ProductDetailModal/ProductDetailModal.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productPublicApi } from '../../api/productPublic';
import { reviewApi } from '../../api/review';
import type { ReviewItem, ReviewStats } from '../../api/review';
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
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [closing, setClosing] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ average: 0, count: 0, distribution: {} });
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 200);
  };

  useEffect(() => {
    if (visible && productId) {
      setLoading(true); setError(null);
      productPublicApi.getDetail(productId)
        .then(p => { setProduct(p); return Promise.all([reviewApi.list(p.id), reviewApi.stats(p.id)]); })
        .then(([revs, st]) => { setReviews(revs); setStats(st); })
        .catch(() => setError('加载商品详情失败')).finally(() => setLoading(false));
    } else {
      setProduct(null); setError(null); setQty(1); setActiveThumb(0); setActiveTab('desc');
      setClosing(false); setReviews([]); setStats({ average: 0, count: 0, distribution: {} });
      setMyRating(0); setMyComment('');
    }
  }, [visible, productId]);

  if (!visible) return null;

  const imgUrl = product?.image_url || '/homepage.jpg';
  const price = Number(product?.price) || 0;

  const handleAddToCart = async () => {
    if (!user) { toast.warning('请先登录'); navigate('/login'); return; }
    if (!product) return;
    try { await addToCart({ product_id: product.id, quantity: qty }); toast.success(`已添加 ${qty} 件到购物车`); onClose(); }
    catch (e: any) { toast.error(e.response?.data?.detail || '添加失败'); }
  };

  const handleSubmitReview = async () => {
    if (!user) { toast.warning('请先登录'); return; }
    if (!productId || myRating < 1) { toast.warning('请选择评分'); return; }
    setSubmitting(true);
    try {
      const r = await reviewApi.create(productId, { rating: myRating, comment: myComment.trim() || undefined });
      setReviews(prev => [r, ...prev]);
      setStats(prev => {
        const newDist = { ...prev.distribution };
        newDist[String(myRating)] = (newDist[String(myRating)] || 0) + 1;
        return { average: ((prev.average * prev.count + myRating) / (prev.count + 1)), count: prev.count + 1, distribution: newDist };
      });
      setMyRating(0); setMyComment('');
      toast.success('评价已提交');
    } catch (e: any) { toast.error(e.response?.data?.detail || '提交失败'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className={`${styles.overlay} ${closing ? styles.closing : ''}`} onClick={handleClose}>
      <div className={`${styles.content} ${closing ? styles.closing : ''}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.breadcrumbs}>
            <a href="/">首页</a><span>/</span><span>{product?.category || '商品'}</span><span>/</span>
            <span style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{product?.name || '详情'}</span>
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
                <div className={styles.gallery}>
                  <img src={activeThumb === 0 ? imgUrl : imgUrl} alt={product.name} className={styles.mainImg} />
                  <div className={styles.thumbGrid}>
                    {[0, 1, 2, 3].map(i => (
                      <img key={i} src={imgUrl} alt="" className={`${styles.thumb} ${activeThumb === i ? styles.thumbActive : ''}`}
                        onClick={() => setActiveThumb(i)} />
                    ))}
                  </div>
                </div>
                <div className={styles.info}>
                  <span className={styles.badge}>New Arrival</span>
                  <h1 className={styles.productName}>{product.name}</h1>
                  <div className={styles.stars}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <i key={i} className={`bi ${i <= Math.round(stats.average) ? 'bi-star-fill' : 'bi-star'}`} />
                    ))}
                    <span>({stats.count} 评价)</span>
                  </div>
                  <div className={styles.price}>¥{price.toFixed(2)}</div>
                  <p className={styles.desc}>{product.description || '精选好物，品质保证。'}</p>
                  <div className={styles.divider} />
                  <div className={styles.qtyRow}>
                    <span className={styles.qtyLabel}>数量</span>
                    <div className={styles.qtyBox}>
                      <button className={styles.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                      <input className={styles.qtyInput} type="number" value={qty} min={1} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
                      <button className={styles.qtyBtn} onClick={() => setQty(q => q + 1)}>+</button>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button className={styles.buyBtn} onClick={handleAddToCart}>加入购物车</button>
                  </div>
                </div>
              </div>

              <div className={styles.tabs}>
                <button className={`${styles.tab} ${activeTab === 'desc' ? styles.tabActive : ''}`} onClick={() => setActiveTab('desc')}>产品描述</button>
                <button className={`${styles.tab} ${activeTab === 'specs' ? styles.tabActive : ''}`} onClick={() => setActiveTab('specs')}>规格参数</button>
                <button className={`${styles.tab} ${activeTab === 'reviews' ? styles.tabActive : ''}`} onClick={() => setActiveTab('reviews')}>用户评价 ({stats.count})</button>
              </div>

              <div className={styles.tabContent}>
                {activeTab === 'desc' ? (
                  <div className={styles.featureGrid}>
                    {(product.features && product.features.length > 0
                      ? product.features
                      : [{ icon: 'bi-star', title: '精选好物', desc: '品质保证，值得信赖' }]
                    ).map((f, i) => (
                      <div key={i} className={styles.featureCard}>
                        <i className={`bi ${f.icon || 'bi-star'}`} />
                        <h4>{f.title}</h4>
                        <p>{f.desc}</p>
                      </div>
                    ))}
                  </div>
                ) : activeTab === 'specs' ? (
                  <table className={styles.specTable}>
                    <tbody>
                      <tr><td>商品名称</td><td>{product.name}</td></tr>
                      <tr><td>价格</td><td>¥{price.toFixed(2)}</td></tr>
                      <tr><td>分类</td><td>{product.category || '未分类'}</td></tr>
                      <tr><td>库存</td><td>{product.stock} 件</td></tr>
                      <tr><td>状态</td><td>{product.is_active ? '上架中' : '已下架'}</td></tr>
                    </tbody>
                  </table>
                ) : (
                  <div>
                    {/* 评分统计 */}
                    <div className={styles.reviewSummary}>
                      <div className={styles.reviewAvg}>
                        <span className={styles.avgNum}>{stats.average.toFixed(1)}</span>
                        <span className={styles.avgMax}>/5</span>
                      </div>
                      <div className={styles.reviewBars}>
                        {[5, 4, 3, 2, 1].map(n => {
                          const cnt = stats.distribution[String(n)] || 0;
                          const pct = stats.count > 0 ? (cnt / stats.count) * 100 : 0;
                          return (
                            <div key={n} className={styles.reviewBarRow}>
                              <span>{n}★</span>
                              <div className={styles.reviewBarTrack}><div className={styles.reviewBarFill} style={{ width: `${pct}%` }} /></div>
                              <span className={styles.reviewBarCnt}>{cnt}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 提交评价 */}
                    {user && (
                      <div className={styles.reviewForm}>
                        <h4>写评价</h4>
                        <div className={styles.ratingStars}>
                          {[1, 2, 3, 4, 5].map(i => (
                            <i key={i} className={`bi ${i <= myRating ? 'bi-star-fill' : 'bi-star'}`}
                              onClick={() => setMyRating(i)} style={{ cursor: 'pointer', color: i <= myRating ? '#f59e0b' : 'var(--outline-variant)', fontSize: '1.3rem' }} />
                          ))}
                        </div>
                        <textarea className="form-control form-control-sm mt-2" rows={2} placeholder="写下你的评价..."
                          value={myComment} onChange={e => setMyComment(e.target.value)} />
                        <button className="btn btn-sm mt-2" style={{ background: 'var(--primary-container)', color: 'var(--on-primary-container)' }}
                          onClick={handleSubmitReview} disabled={submitting}>
                          {submitting ? '提交中...' : '提交评价'}
                        </button>
                      </div>
                    )}

                    {/* 评论列表 */}
                    <div className={styles.reviewList}>
                      {reviews.map(r => (
                        <div key={r.id} className={styles.reviewItem}>
                          <div className={styles.reviewItemHead}>
                            <strong>{r.user?.full_name || r.user?.username || '匿名'}</strong>
                            <span className={styles.reviewItemStars}>
                              {Array.from({ length: r.rating }, (_, i) => <i key={i} className="bi bi-star-fill" style={{ color: '#f59e0b', fontSize: '0.75rem' }} />)}
                            </span>
                            <span className={styles.reviewItemTime}>{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                          {r.comment && <p className={styles.reviewItemComment}>{r.comment}</p>}
                        </div>
                      ))}
                      {reviews.length === 0 && <p className="text-muted">暂无评价</p>}
                    </div>
                  </div>
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
