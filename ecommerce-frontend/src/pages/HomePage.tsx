import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { favoriteApi } from '../api/favorite';
import { productPublicApi } from '../api/productPublic';
import ProductDetailModal from '../components/ProductDetailModal/ProductDetailModal';
import { useToast } from '../components/Toast';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import type { Product, ProductSearchParams } from '../types/product';
import styles from './HomePage.module.css';

const DEFAULT_IMAGE = '/homepage.jpg';

const sortOptions = [
  { value: 'created_at-desc', label: '最新上架' },
  { value: 'sales_count-desc', label: '销量优先' },
  { value: 'avg_rating-desc', label: '评分优先' },
  { value: 'price-asc', label: '价格从低到高' },
  { value: 'price-desc', label: '价格从高到低' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set());

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
    const load = async () => {
      setLoading(true);
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
        toast.error('加载商品失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [query, user, toast]);

  const updateQuery = (patch: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next);
  };

  const handleAddToCart = async (id: number) => {
    if (!user) {
      toast.warning('请先登录');
      navigate('/login');
      return;
    }
    try {
      await addToCart({ product_id: id, quantity: 1 });
      toast.success('已加入购物车');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '加入购物车失败');
    }
  };

  const handleToggleFav = async (id: number) => {
    if (!user) {
      toast.warning('请先登录');
      navigate('/login');
      return;
    }
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

  return (
    <div className={styles.home}>
      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">关键词</label>
              <input
                className="form-control"
                value={query.keyword}
                placeholder="搜索商品名称或描述"
                onChange={(e) => updateQuery({ keyword: e.target.value || null })}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">分类</label>
              <select
                className="form-select"
                value={query.category}
                onChange={(e) => updateQuery({ category: e.target.value || null })}
              >
                <option value="">全部分类</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">最低价</label>
              <input
                type="number"
                className="form-control"
                value={query.min_price}
                onChange={(e) => updateQuery({ min_price: e.target.value || null })}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">最高价</label>
              <input
                type="number"
                className="form-control"
                value={query.max_price}
                onChange={(e) => updateQuery({ max_price: e.target.value || null })}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">排序</label>
              <select
                className="form-select"
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
            </div>
            <div className="col-md-1">
              <div className="form-check mt-4">
                <input
                  id="in-stock"
                  className="form-check-input"
                  type="checkbox"
                  checked={query.in_stock}
                  onChange={(e) => updateQuery({ in_stock: e.target.checked ? '1' : null })}
                />
                <label className="form-check-label" htmlFor="in-stock">有货</label>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-danger" /></div>
      ) : products.length === 0 ? (
        <div className="alert alert-light border text-center py-5">暂无符合条件的商品</div>
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="fw-bold mb-0">商品列表</h3>
            <span className="text-muted">共 {products.length} 件商品</span>
          </div>
          <div className="row g-4">
            {products.map((product) => (
              <div key={product.id} className="col-sm-6 col-lg-4 col-xl-3">
                <div className="card h-100 border-0 shadow-sm">
                  <div
                    className="position-relative"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedProductId(product.id);
                      setModalVisible(true);
                    }}
                  >
                    <img
                      src={product.image_url || DEFAULT_IMAGE}
                      alt={product.name}
                      className="card-img-top"
                      style={{ height: 220, objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      className="btn btn-light position-absolute top-0 end-0 m-2 rounded-circle"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFav(product.id);
                      }}
                    >
                      <i className={`bi ${favoritedIds.has(product.id) ? 'bi-heart-fill text-danger' : 'bi-heart'}`} />
                    </button>
                  </div>
                  <div className="card-body d-flex flex-column">
                    <div className="small text-muted mb-1">{product.category || '未分类'}</div>
                    <h5 className="card-title">{product.name}</h5>
                    <p className="card-text text-muted small flex-grow-1">{product.description || '精选好物，欢迎选购。'}</p>
                    <div className="d-flex justify-content-between small mb-2">
                      <span>销量 {product.sales_count || 0}</span>
                      <span>评分 {(product.avg_rating || 0).toFixed(1)} / 5</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold text-danger fs-5">￥{Number(product.price).toFixed(2)}</div>
                        <div className="small text-muted">{product.stock > 0 ? `库存 ${product.stock}` : '暂时缺货'}</div>
                      </div>
                      <button
                        className="btn btn-danger"
                        disabled={product.stock <= 0}
                        onClick={() => handleAddToCart(product.id)}
                      >
                        加入购物车
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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
