import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';

import { favoriteApi } from '../api/favorite';
import { productPublicApi } from '../api/productPublic';
import ProductDetailModal from '../components/ProductDetailModal/ProductDetailModal';
import { useToast } from '../components/Toast';
import type { CategoryContextType } from '../layouts/PublicLayout';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import type { Product, ProductSearchParams } from '../types/product';
import styles from './HomePage.module.css';

const DEFAULT_IMAGE = '/homepage.jpg';

const CATEGORY_EMOJI: Record<string, string> = {
  手机数码: '📱',
  电脑办公: '💻',
  影音娱乐: '🎧',
  智能穿戴: '⌚',
  游戏娱乐: '🎮',
};

const sortOptions = [
  { value: 'created_at-desc', label: '最新上架' },
  { value: 'sales_count-desc', label: '销量优先' },
  { value: 'avg_rating-desc', label: '评分优先' },
  { value: 'price-asc', label: '价格从低到高' },
  { value: 'price-desc', label: '价格从高到低' },
];

interface ProductRowProps {
  title: string;
  products: Product[];
  favoritedIds: Set<number>;
  animatingFavoriteId: number | null;
  animatingCartId: number | null;
  onToggleFav: (id: number) => void;
  onAddCart: (id: number) => void;
  onDetail: (id: number) => void;
}

const ProductRow = ({
  title,
  products,
  favoritedIds,
  animatingFavoriteId,
  animatingCartId,
  onToggleFav,
  onAddCart,
  onDetail,
}: ProductRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -30px 0px' },
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
          <button type="button" className={styles.arrowBtn} onClick={() => scroll('left')} aria-label="向左滚动">
            <i className="bi bi-chevron-left" />
          </button>
          <button type="button" className={styles.arrowBtn} onClick={() => scroll('right')} aria-label="向右滚动">
            <i className="bi bi-chevron-right" />
          </button>
        </div>
      </div>

      <div className={styles.scrollRow} ref={rowRef}>
        {products.map((product, idx) => {
          const price = Number(product.price);
          const isFeatured = idx === 0;

          return (
            <article key={product.id} className={`${styles.productCard} ${isFeatured ? styles.featured : ''}`}>
              <div className={styles.imgWrap} onClick={() => onDetail(product.id)}>
                <img src={product.image_url || DEFAULT_IMAGE} alt={product.name} className={styles.productImg} />
                <span className={styles.hotTag}>HOT</span>
                <button
                  type="button"
                  className={`${styles.favBtn} ${animatingFavoriteId === product.id ? styles.pop : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFav(product.id);
                  }}
                  title={favoritedIds.has(product.id) ? '取消收藏' : '添加收藏'}
                >
                  <i className={`bi ${favoritedIds.has(product.id) ? 'bi-heart-fill' : 'bi-heart'}`} />
                </button>
              </div>

              <div className={styles.productBody}>
                <div className={styles.productName}>{product.name}</div>
                <div className={styles.productDesc}>{product.description || '精选好物'}</div>
                <div className={styles.productFooter}>
                  <div className={styles.priceBlock}>
                    <span className={styles.productPrice}>¥{price.toFixed(2)}</span>
                    <div className={styles.stockText}>{product.stock > 0 ? `库存 ${product.stock}` : '暂时缺货'}</div>
                  </div>
                  <button
                    type="button"
                    className={`${styles.cartBtn} ${animatingCartId === product.id ? styles.pop : ''}`}
                    onClick={() => onAddCart(product.id)}
                    disabled={product.stock <= 0}
                    title="加入购物车"
                  >
                    <i className="bi bi-cart-plus" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const { setActiveCategory } = useOutletContext<CategoryContextType>();
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set());
  const [animatingFavoriteId, setAnimatingFavoriteId] = useState<number | null>(null);
  const [animatingCartId, setAnimatingCartId] = useState<number | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const query = useMemo(() => {
    const sortValue = searchParams.get('sort') || 'created_at-desc';
    const [sort_by, sort_order] = sortValue.split('-') as [ProductSearchParams['sort_by'], ProductSearchParams['sort_order']];
    return {
      keyword: searchParams.get('keyword') || '',
      category: searchParams.get('category') || '',
      min_price: searchParams.get('min_price') || '',
      max_price: searchParams.get('max_price') || '',
      in_stock: searchParams.get('in_stock') === '1',
      sort_by,
      sort_order,
    };
  }, [searchParams]);

  useEffect(() => {
    productPublicApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setActiveCategory(query.category || '');
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: ProductSearchParams = {
          page: 1,
          size: 100,
          keyword: query.keyword || undefined,
          category: query.category || undefined,
          min_price: query.min_price ? Number(query.min_price) : undefined,
          max_price: query.max_price ? Number(query.max_price) : undefined,
          in_stock: query.in_stock || undefined,
          sort_by: query.sort_by,
          sort_order: query.sort_order,
          is_active: true,
        };

        const res = await productPublicApi.list(params);
        setProducts(res.items);

        if (user && res.items.length > 0) {
          const ids = res.items.map((item) => item.id);
          const result = await favoriteApi.check(ids);
          setFavoritedIds(new Set(ids.filter((id) => result[String(id)])));
        } else {
          setFavoritedIds(new Set());
        }
      } catch {
        setError('加载商品失败');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [query, user, setActiveCategory]);

  const groupedProducts = useMemo(() => (
    products.reduce<Record<string, Product[]>>((acc, product) => {
      const category = product.category || '其他';
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {})
  ), [products]);

  const updateQuery = (patch: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next);
  };

  const activeFilterCount = [
    Boolean(query.keyword),
    Boolean(query.category),
    Boolean(query.min_price),
    Boolean(query.max_price),
    query.in_stock,
    `${query.sort_by}-${query.sort_order}` !== 'created_at-desc',
  ].filter(Boolean).length;

  const handleAddToCart = async (id: number) => {
    if (!user) {
      toast.warning('请先登录');
      navigate('/login');
      return;
    }

    setAnimatingCartId(id);
    window.setTimeout(() => setAnimatingCartId((current) => (current === id ? null : current)), 500);

    try {
      await addToCart({ product_id: id, quantity: 1 });
      toast.success('已加入购物车');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '加入失败');
    }
  };

  const handleToggleFav = async (id: number) => {
    if (!user) {
      toast.warning('请先登录');
      navigate('/login');
      return;
    }

    setAnimatingFavoriteId(id);
    window.setTimeout(() => setAnimatingFavoriteId((current) => (current === id ? null : current)), 500);

    try {
      const res = await favoriteApi.toggle(id);
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (res.favorited) next.add(id);
        else next.delete(id);
        return next;
      });
    } catch {
      toast.error('收藏操作失败');
    }
  };

  const hasAdvancedFilters =
    Boolean(query.keyword) ||
    Boolean(query.min_price) ||
    Boolean(query.max_price) ||
    query.in_stock ||
    `${query.sort_by}-${query.sort_order}` !== 'created_at-desc';

  const renderRows = () => {
    if (!products.length) {
      return <div className="text-center py-5" style={{ color: 'var(--on-surface-variant)' }}>暂无商品</div>;
    }

    if (hasAdvancedFilters || query.category) {
      const title = query.category ? `${CATEGORY_EMOJI[query.category] || '📦'} ${query.category}` : '📦 商品列表';
      return (
        <ProductRow
          title={title}
          products={products}
          favoritedIds={favoritedIds}
          animatingFavoriteId={animatingFavoriteId}
          animatingCartId={animatingCartId}
          onToggleFav={handleToggleFav}
          onAddCart={handleAddToCart}
          onDetail={(id) => {
            setSelectedProductId(id);
            setModalVisible(true);
          }}
        />
      );
    }

    return (
      <>
        <ProductRow
          title="🔥 热门推荐"
          products={products}
          favoritedIds={favoritedIds}
          animatingFavoriteId={animatingFavoriteId}
          animatingCartId={animatingCartId}
          onToggleFav={handleToggleFav}
          onAddCart={handleAddToCart}
          onDetail={(id) => {
            setSelectedProductId(id);
            setModalVisible(true);
          }}
        />
        {Object.keys(groupedProducts).map((category) => (
          <ProductRow
            key={category}
            title={`${CATEGORY_EMOJI[category] || '📦'} ${category}`}
            products={groupedProducts[category]}
            favoritedIds={favoritedIds}
            animatingFavoriteId={animatingFavoriteId}
            animatingCartId={animatingCartId}
            onToggleFav={handleToggleFav}
            onAddCart={handleAddToCart}
            onDetail={(id) => {
              setSelectedProductId(id);
              setModalVisible(true);
            }}
          />
        ))}
      </>
    );
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary-container)' }} /></div>;
  }

  if (error) {
    return <div className="alert" style={{ background: 'var(--error-container)', color: 'var(--error)', borderRadius: 'var(--radius)' }}>{error}</div>;
  }

  return (
    <div className={styles.home} id="products-section">
      {filterOpen && <button type="button" className={styles.filterBackdrop} onClick={() => setFilterOpen(false)} aria-label="关闭筛选面板" />}

      <div className={`${styles.filterPanel} ${filterOpen ? styles.filterPanelOpen : ''}`}>
        <div className={styles.filterPanelHeader}>
          <div>
            <div className={styles.filterPanelTitle}>商品筛选</div>
            <div className={styles.filterPanelHint}>支持关键词、分类、价格、排序和仅看有货</div>
          </div>
          <button type="button" className={styles.filterClose} onClick={() => setFilterOpen(false)} aria-label="关闭">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className={styles.filterGrid}>
          <label className={styles.filterField}>
            <span>关键词</span>
            <input
              className={styles.filterInput}
              value={query.keyword}
              placeholder="搜索商品名称或描述"
              onChange={(e) => updateQuery({ keyword: e.target.value || null })}
            />
          </label>

          <label className={styles.filterField}>
            <span>分类</span>
            <select
              className={styles.filterInput}
              value={query.category}
              onChange={(e) => updateQuery({ category: e.target.value || null })}
            >
              <option value="">全部分类</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>

          <label className={styles.filterField}>
            <span>最低价</span>
            <input
              type="number"
              className={styles.filterInput}
              value={query.min_price}
              placeholder="0"
              onChange={(e) => updateQuery({ min_price: e.target.value || null })}
            />
          </label>

          <label className={styles.filterField}>
            <span>最高价</span>
            <input
              type="number"
              className={styles.filterInput}
              value={query.max_price}
              placeholder="不限"
              onChange={(e) => updateQuery({ max_price: e.target.value || null })}
            />
          </label>

          <label className={styles.filterField}>
            <span>排序</span>
            <select
              className={styles.filterInput}
              value={`${query.sort_by}-${query.sort_order}`}
              onChange={(e) => {
                const [sort_by, sort_order] = e.target.value.split('-');
                updateQuery({ sort: `${sort_by}-${sort_order}` });
              }}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className={styles.stockToggle}>
            <input
              type="checkbox"
              checked={query.in_stock}
              onChange={(e) => updateQuery({ in_stock: e.target.checked ? '1' : null })}
            />
            <span>仅看有货</span>
          </label>
        </div>
      </div>

      <button type="button" className={styles.filterFab} onClick={() => setFilterOpen((value) => !value)} aria-label="打开筛选面板">
        <span className={styles.filterFabIcon}>
          <i className={`bi ${filterOpen ? 'bi-x-lg' : 'bi-sliders2-vertical'}`} />
        </span>
        <span className={styles.filterFabText}>
          筛选
          {activeFilterCount > 0 && <em>{activeFilterCount}</em>}
        </span>
      </button>

      {renderRows()}

      <ProductDetailModal
        visible={modalVisible}
        productId={selectedProductId}
        onClose={() => {
          setModalVisible(false);
          setSelectedProductId(null);
        }}
      />
    </div>
  );
};

export default HomePage;
