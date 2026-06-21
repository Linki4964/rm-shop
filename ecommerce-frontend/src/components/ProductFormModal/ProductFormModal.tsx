// src/components/ProductFormModal/ProductFormModal.tsx
import { useEffect, useState } from 'react';
import { productAdminApi } from '../../api/productAdmin';
import type  { Product, ProductCreate, ProductUpdate, ProductFeature } from '../../types/product';

const FEATURE_ICONS = [
  'bi-cpu', 'bi-motherboard', 'bi-camera', 'bi-camera-video',
  'bi-display', 'bi-tv', 'bi-headphones', 'bi-volume-up',
  'bi-battery-charging', 'bi-lightning-charge', 'bi-wifi', 'bi-bluetooth',
  'bi-usb-plug', 'bi-speedometer2', 'bi-rocket-takeoff',
  'bi-shield-check', 'bi-shield-lock', 'bi-fingerprint',
  'bi-gem', 'bi-palette', 'bi-droplet', 'bi-star', 'bi-heart',
  'bi-gift', 'bi-trophy', 'bi-hdd', 'bi-sd-card', 'bi-cloud-arrow-up',
  'bi-phone', 'bi-laptop', 'bi-smartwatch', 'bi-speaker',
  'bi-mouse', 'bi-keyboard', 'bi-router',
];
import { useToast } from '../Toast';

interface Props {
  visible: boolean;
  onClose: (refetch?: boolean) => void;
  product: Product | null;
  categories: string[];
}

const ProductFormModal = ({ visible, onClose, product, categories }: Props) => {
  const toast = useToast();
  const [formData, setFormData] = useState<ProductCreate>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    image_url: '',
    category: '',
    is_active: true,
    features: [],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        image_url: product.image_url || '',
        category: product.category || '',
        is_active: product.is_active,
        features: product.features || [],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        image_url: '',
        category: '',
        is_active: true,
        features: [],
      });
    }
  }, [product, visible]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (product) {
        // 更新
        const updateData: ProductUpdate = {};
        if (formData.name !== product.name) updateData.name = formData.name;
        if (formData.description !== product.description) updateData.description = formData.description;
        if (formData.price !== product.price) updateData.price = formData.price;
        if (formData.stock !== product.stock) updateData.stock = formData.stock;
        if (formData.image_url !== product.image_url) updateData.image_url = formData.image_url;
        if (formData.category !== product.category) updateData.category = formData.category;
        if (formData.is_active !== product.is_active) updateData.is_active = formData.is_active;
        if (JSON.stringify(formData.features) !== JSON.stringify(product.features || [])) updateData.features = formData.features;
        await productAdminApi.update(product.id, updateData);
      } else {
        // 新增
        await productAdminApi.create(formData);
      }
      onClose(true);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{product ? '编辑商品' : '新增商品'}</h5>
            <button type="button" className="btn-close" onClick={() => onClose()}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">商品名称 *</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">描述</label>
                <textarea
                  className="form-control"
                  rows={3}
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">价格 *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0.01"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">库存</label>
                  <input
                    type="number"
                    className="form-control"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">分类</label>
                  <select
                    className="form-select"
                    name="category"
                    value={formData.category || ''}
                    onChange={handleChange}
                  >
                    <option value="">未分类</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">图片URL</label>
                  <input
                    type="text"
                    className="form-control"
                    name="image_url"
                    value={formData.image_url || ''}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </div>
              </div>
              {/* 产品特性编辑 */}
              <div className="mb-3">
                <label className="form-label">产品特性卡片（详情页展示）</label>
                {(formData.features || []).map((f, idx) => (
                  <div key={idx} className="row g-2 mb-2">
                    <div className="col-2">
                      <div style={{ position: 'relative' }}>
                        <button type="button" className="form-control form-control-sm text-start" style={{ cursor: 'pointer' }}
                          onClick={() => {
                            const panel = document.getElementById(`icon-panel-${idx}`);
                            if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                          }}>
                          {f.icon ? <><i className={`bi ${f.icon}`} /> {f.icon}</> : '选择图标'}
                        </button>
                        <div id={`icon-panel-${idx}`} style={{ display: 'none', position: 'absolute', zIndex: 10, background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: '12px', padding: '0.5rem', width: '280px', maxHeight: '200px', overflowY: 'auto', boxShadow: 'var(--shadow-card)' }}>
                          <div className="d-flex flex-wrap gap-1">
                            {FEATURE_ICONS.map(ic => (
                              <button key={ic} type="button"
                                className={`btn btn-sm ${f.icon === ic ? 'btn-primary' : 'btn-outline-secondary'}`}
                                style={{ fontSize: '0.75rem' }}
                                title={ic}
                                onClick={() => {
                                  const updated = [...(formData.features || [])];
                                  updated[idx] = { ...updated[idx], icon: ic };
                                  setFormData(prev => ({ ...prev, features: updated }));
                                  const panel = document.getElementById(`icon-panel-${idx}`);
                                  if (panel) panel.style.display = 'none';
                                }}>
                                <i className={`bi ${ic}`} />
                              </button>
                            ))}
                          </div>
                          <div className="input-group input-group-sm mt-2">
                            <span className="input-group-text" style={{ fontSize: '0.7rem' }}>bi-</span>
                            <input className="form-control form-control-sm" placeholder="自定义图标名..."
                              defaultValue={f.icon?.startsWith('bi-') ? f.icon.slice(3) : f.icon}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  const val = (e.target as HTMLInputElement).value.trim();
                                  if (val) {
                                    const ic = val.startsWith('bi-') ? val : `bi-${val}`;
                                    const updated = [...(formData.features || [])];
                                    updated[idx] = { ...updated[idx], icon: ic };
                                    setFormData(prev => ({ ...prev, features: updated }));
                                    const panel = document.getElementById(`icon-panel-${idx}`);
                                    if (panel) panel.style.display = 'none';
                                  }
                                }
                              }} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-3">
                      <input className="form-control form-control-sm" placeholder="标题" value={f.title}
                        onChange={e => {
                          const updated = [...(formData.features || [])];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setFormData(prev => ({ ...prev, features: updated }));
                        }} />
                    </div>
                    <div className="col-5">
                      <input className="form-control form-control-sm" placeholder="描述" value={f.desc}
                        onChange={e => {
                          const updated = [...(formData.features || [])];
                          updated[idx] = { ...updated[idx], desc: e.target.value };
                          setFormData(prev => ({ ...prev, features: updated }));
                        }} />
                    </div>
                    <div className="col-2">
                      <button type="button" className="btn btn-sm btn-outline-danger w-100"
                        onClick={() => setFormData(prev => ({ ...prev, features: (prev.features || []).filter((_, i) => i !== idx) }))}>
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-outline-primary"
                  onClick={() => setFormData(prev => ({ ...prev, features: [...(prev.features || []), { icon: 'bi-star', title: '', desc: '' }] }))}>
                  <i className="bi bi-plus-circle" /> 添加特性
                </button>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  id="activeCheckbox"
                />
                <label className="form-check-label" htmlFor="activeCheckbox">
                  上架商品
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => onClose()}>
                取消
              </button>
              <button type="submit" className="btn btn-danger" disabled={submitting}>
                {submitting ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;