// src/pages/HomePage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { productPublicApi } from '../api/productPublic';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import type { Product } from '../types/product';
import type { CategoryContextType } from '../layouts/PublicLayout';
import ProductDetailModal from '../components/ProductDetailModal/ProductDetailModal';
import styles from './HomePage.module.css';

const DEFAULT_IMAGE = 'https://via.placeholder.com/300x200?text=No+Image';

const HomePage = () => {
  const navigate = useNavigate();
  const { activeCategory } = useOutletContext<CategoryContextType>();
  const { addToCart } = useCartStore();
  const { user } = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchHotProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: any = { page: 1, size: 9, is_active: true };
        if (activeCategory) params.category = activeCategory;
        const res = await productPublicApi.list(params);
        setProducts(res.items);
      } catch (err) {
        console.error('获取商品失败:', err);
        setError('加载商品失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchHotProducts();
  }, [activeCategory]);

  const handleShowDetail = (productId: number) => {
    setSelectedProductId(productId);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedProductId(null);
  };

  const handleAddToCart = async (productId: number) => {
    if (!user) {
      // 未登录，提示并跳转到登录页
      alert('请先登录');
      navigate('/login');
      return;
    }
    try {
      await addToCart({ product_id: productId, quantity: 1 });
      alert('已添加到购物车');
    } catch (err: any) {
      alert(err.response?.data?.detail || '添加失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-danger" />
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger text-center">{error}</div>;
  }

  if (products.length === 0) {
    return <div className="text-center text-muted py-5">暂无商品</div>;
  }

  return (
    <div className={styles.home}>
      <h3 className="mb-4 fw-bold">🔥 热销推荐</h3>
      <div className="row">
        {products.map((product) => (
          <div key={product.id} className="col-md-3 mb-4">
            <div className="card h-100 shadow-sm">
              <img
                src={product.image_url || DEFAULT_IMAGE}
                className="card-img-top"
                alt={product.name}
                style={{ height: '200px', objectFit: 'contain', background: '#f8f9fa' }}
              />
              <div className="card-body d-flex flex-column">
                <h5 className="card-title fs-6">{product.name}</h5>
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <span className="text-danger fw-bold fs-5">
                    ¥{product.price.toFixed(2)}
                  </span>
                  <div className="btn-group" role="group">
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleAddToCart(product.id)}
                    >
                      <i className="bi bi-cart-plus"></i> 加入
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => handleShowDetail(product.id)}
                    >
                      详情
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ProductDetailModal
        visible={modalVisible}
        productId={selectedProductId}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default HomePage;