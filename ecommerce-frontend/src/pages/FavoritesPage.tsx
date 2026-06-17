// src/pages/FavoritesPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { favoriteApi } from '../api/favorite';
import type { FavoriteItem } from '../api/favorite';
import type { Product } from '../types/product';

const DEFAULT_IMAGE = 'https://via.placeholder.com/400x400/f5f3ee/9a442d?text=EasyShop';

const FavoritesPage = () => {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const data = await favoriteApi.list();
      setItems(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFavorites(); }, []);

  const handleRemove = async (productId: number) => {
    await favoriteApi.toggle(productId);
    setItems(prev => prev.filter(i => i.product_id !== productId));
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary-container)' }} /></div>;
  }

  if (!items.length) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-heart" style={{ fontSize: '3rem', color: 'var(--outline-variant)' }} />
        <p className="mt-3" style={{ color: 'var(--on-surface-variant)' }}>暂无收藏商品</p>
        <Link to="/" className="btn mt-2" style={{ background: 'var(--primary-container)', color: 'var(--on-primary-container)', borderRadius: 'var(--radius)', fontWeight: 600 }}>去逛逛</Link>
      </div>
    );
  }

  return (
    <div>
      <h3 className="fw-bold mb-4" style={{ fontFamily: '"Manrope","Noto Sans SC",sans-serif', fontSize: '1.5rem' }}>
        <i className="bi bi-heart-fill me-2" style={{ color: '#e74c3c' }} />我的收藏
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        {items.map(item => {
          const product = item.product as Product | null;
          if (!product) return null;
          return (
            <div key={item.id} style={{
              background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius)',
              border: '1px solid var(--outline-variant)', overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <Link to={`/?category=${encodeURIComponent(product.category || '')}`}>
                <img src={product.image_url || DEFAULT_IMAGE} alt={product.name}
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
              </Link>
              <div style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{product.name}</div>
                <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  ¥{Number(product.price).toFixed(2)}
                </div>
                <button
                  className="btn btn-sm w-100"
                  style={{ border: '1px solid var(--outline-variant)', color: 'var(--on-surface-variant)', borderRadius: 'var(--radius)' }}
                  onClick={() => handleRemove(product.id)}
                >
                  <i className="bi bi-heartbreak me-1" />取消收藏
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FavoritesPage;
