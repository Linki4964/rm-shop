// src/pages/HomePage.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { productPublicApi } from '../api/productPublic';
import { favoriteApi } from '../api/favorite';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import type { Product } from '../types/product';
import type { CategoryContextType } from '../layouts/PublicLayout';
import ProductDetailModal from '../components/ProductDetailModal/ProductDetailModal';
import { useToast } from '../components/Toast';
import styles from './HomePage.module.css';

const DEFAULT_IMAGE = 'https://via.placeholder.com/400x400/f5f3ee/9a442d?text=EasyShop';

const CATEGORY_EMOJI: Record<string, string> = {
  '手机数码': '📱', '电脑办公': '💻', '影音娱乐': '🎧', '智能穿戴': '⌚', '游戏娱乐': '🎮',
};

interface ProductRowProps {
  title: string;
  products: Product[];
  favoritedIds: Set<number>;
  onToggleFav: (id: number) => void;
  onAddCart: (id: number) => void;
  onDetail: (id: number) => void;
}

const ProductRow = ({ title, products, favoritedIds, onToggleFav, onAddCart, onDetail }: ProductRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el); } },
      { threshold: 0.15, rootMargin: '0px 0px -30px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!products.length) return null;

  return (
    <section ref={sectionRef} className={`${styles.categorySection} ${visible ? styles.visible : ''}`}>
      <div className={styles.catHeader}>
        <h3 className={styles.catTitle}>{title}</h3>
        <div className={styles.arrowBtns}>
          <button className={styles.arrowBtn} onClick={() => scroll('left')}><i className="bi bi-chevron-left" /></button>
          <button className={styles.arrowBtn} onClick={() => scroll('right')}><i className="bi bi-chevron-right" /></button>
        </div>
      </div>
      <div className={styles.scrollRow} ref={rowRef}>
        {products.map((product, idx) => {
          const price = Number(product.price);
          const isFeatured = idx === 0;
          return (
            <div key={product.id} className={`${styles.productCard} ${isFeatured ? styles.featured : ''}`}>
              <div className={styles.imgWrap} onClick={() => onDetail(product.id)}>
                <img src={product.image_url || DEFAULT_IMAGE} alt={product.name} className={styles.productImg} />
                <span className={styles.hotTag}>HOT</span>
                <button className={styles.favBtn} onClick={(e) => { e.stopPropagation(); onToggleFav(product.id); }}
                  title={favoritedIds.has(product.id) ? '取消收藏' : '添加收藏'}>
                  <i className={`bi ${favoritedIds.has(product.id) ? 'bi-heart-fill' : 'bi-heart'}`} />
                </button>
              </div>
              <div className={styles.productBody}>
                <div className={styles.productName}>{product.name}</div>
                <div className={styles.productDesc}>{product.description || '精选好物'}</div>
                <div className={styles.productFooter}>
                  <span className={styles.productPrice}>¥{price.toFixed(2)}</span>
                  <button className={styles.cartBtn} onClick={() => onAddCart(product.id)} title="加入购物车">
                    <i className="bi bi-cart-plus" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const { setActiveCategory } = useOutletContext<CategoryContextType>();
  const { addToCart } = useCartStore();
  const { user } = useAuthStore();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set());

  const urlCategory = searchParams.get('category') || '';

  useEffect(() => {
    setActiveCategory(urlCategory);
    setLoading(true);
    setError(null);
    productPublicApi.list({ page: 1, size: 100, is_active: true })
      .then(async res => {
        let items = res.items;
        if (urlCategory) items = items.filter((p: Product) => p.category === urlCategory);
        setAllProducts(items);
        if (user && items.length > 0) {
          const ids = items.map((p: Product) => p.id);
          const result = await favoriteApi.check(ids);
          setFavoritedIds(new Set(ids.filter((id: number) => result[String(id)])));
        }
      })
      .catch(() => setError('加载商品失败'))
      .finally(() => setLoading(false));
  }, [urlCategory]); // eslint-disable-line

  // 按分类分组
  const grouped = allProducts.reduce<Record<string, Product[]>>((acc, p) => {
    const cat = p.category || '其他';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});
  const categories = Object.keys(grouped);

  const handleAddToCart = async (id: number) => {
    if (!user) { toast.warning('请先登录'); navigate('/login'); return; }
    try { await addToCart({ product_id: id, quantity: 1 }); toast.success('已添加到购物车'); }
    catch (e: any) { toast.error(e.response?.data?.detail || '添加失败'); }
  };

  const handleToggleFav = async (id: number) => {
    if (!user) { toast.warning('请先登录'); navigate('/login'); return; }
    try {
      const res = await favoriteApi.toggle(id);
      setFavoritedIds(prev => { const n = new Set(prev); res.favorited ? n.add(id) : n.delete(id); return n; });
    } catch { /* */ }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary-container)' }} /></div>;
  if (error) return <div className="alert" style={{ background: 'var(--error-container)', color: 'var(--error)', borderRadius: 'var(--radius)' }}>{error}</div>;

  return (
    <div className={styles.home} id="products-section">
      {allProducts.length === 0 ? (
        <div className="text-center py-5" style={{ color: 'var(--on-surface-variant)' }}>暂无商品</div>
      ) : urlCategory ? (
        <ProductRow
          title={(CATEGORY_EMOJI[urlCategory] || '📦') + ' ' + urlCategory}
          products={allProducts}
          favoritedIds={favoritedIds}
          onToggleFav={handleToggleFav}
          onAddCart={handleAddToCart}
          onDetail={(id) => { setSelectedProductId(id); setModalVisible(true); }}
        />
      ) : (
        <>
          {/* 全部推荐 */}
          <ProductRow
            title="🔥 热门推荐"
            products={allProducts}
            favoritedIds={favoritedIds}
            onToggleFav={handleToggleFav}
            onAddCart={handleAddToCart}
            onDetail={(id) => { setSelectedProductId(id); setModalVisible(true); }}
          />
          {/* 按分类分组 */}
          {categories.map(cat => (
            <ProductRow
              key={cat}
              title={(CATEGORY_EMOJI[cat] || '📦') + ' ' + cat}
              products={grouped[cat]}
              favoritedIds={favoritedIds}
              onToggleFav={handleToggleFav}
              onAddCart={handleAddToCart}
              onDetail={(id) => { setSelectedProductId(id); setModalVisible(true); }}
            />
          ))}
        </>
      )}

      <ProductDetailModal visible={modalVisible} productId={selectedProductId}
        onClose={() => { setModalVisible(false); setSelectedProductId(null); }} />
    </div>
  );
};

export default HomePage;
