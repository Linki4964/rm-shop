// src/pages/HomePage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { productPublicApi } from '../api/productPublic';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import type { Product } from '../types/product';
import type { CategoryContextType } from '../layouts/PublicLayout';
import ProductDetailModal from '../components/ProductDetailModal/ProductDetailModal';
import { useToast } from '../components/Toast';
import styles from './HomePage.module.css';

const DEFAULT_IMAGE = 'https://via.placeholder.com/400x400/f5f3ee/9a442d?text=EasyShop';

const HomePage = () => {
  const navigate = useNavigate();
  const { activeCategory, setActiveCategory } = useOutletContext<CategoryContextType>();
  const { addToCart } = useCartStore();
  const { user } = useAuthStore();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 直接从 URL 读取当前分类，驱动商品加载
  const urlCategory = searchParams.get('category') || '';

  useEffect(() => {
    setActiveCategory(urlCategory);
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: any = { page: 1, size: 12, is_active: true };
        if (urlCategory) params.category = urlCategory;
        const res = await productPublicApi.list(params);
        setProducts(res.items);
      } catch {
        setError('加载商品失败');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [urlCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddToCart = async (productId: number) => {
    if (!user) {
      toast.warning('请先登录');
      navigate('/login');
      return;
    }
    try {
      await addToCart({ product_id: productId, quantity: 1 });
      toast.success('已添加到购物车');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || '添加失败');
    }
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary-container)' }} /></div>;
  }
  if (error) {
    return <div className="alert" style={{ background: 'var(--error-container)', color: 'var(--error)', borderRadius: 'var(--radius)' }}>{error}</div>;
  }

  return (
    <div className={styles.home} id="products-section">
      {/* 商品 */}
      <section>
        <h3 className={styles.sectionTitle}>
          {activeCategory ? activeCategory : '🔥 热销推荐'}
        </h3>
        {products.length === 0 ? (
          <div className="text-center py-5" style={{ color: 'var(--on-surface-variant)' }}>暂无商品</div>
        ) : (
          <div className={styles.productGrid}>
            {products.map(product => {
              const price = Number(product.price);
              return (
                <div key={product.id} className={styles.productCard}>
                  <div className={styles.imgWrap} onClick={() => { setSelectedProductId(product.id); setModalVisible(true); }}>
                    <img src={product.image_url || DEFAULT_IMAGE} alt={product.name} className={styles.productImg} />
                    <span className={styles.hotTag}>HOT</span>
                  </div>
                  <div className={styles.productBody}>
                    <div className={styles.productName}>{product.name}</div>
                    <div className={styles.productDesc}>{product.description || '精选好物'}</div>
                    <div className={styles.productFooter}>
                      <span className={styles.productPrice}>¥{price.toFixed(2)}</span>
                      <button className={styles.cartBtn} onClick={() => handleAddToCart(product.id)} title="加入购物车">
                        <i className="bi bi-cart-plus" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ProductDetailModal visible={modalVisible} productId={selectedProductId}
        onClose={() => { setModalVisible(false); setSelectedProductId(null); }} />
    </div>
  );
};

export default HomePage;
