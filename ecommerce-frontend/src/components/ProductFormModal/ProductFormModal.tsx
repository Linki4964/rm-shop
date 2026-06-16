// src/components/ProductFormModal/ProductFormModal.tsx
import { useEffect, useState } from 'react';
import { productAdminApi } from '../../api/productAdmin';
import type  { Product, ProductCreate, ProductUpdate } from '../../types/product';

interface Props {
  visible: boolean;
  onClose: (refetch?: boolean) => void;
  product: Product | null;
  categories: string[];
}

const ProductFormModal = ({ visible, onClose, product, categories }: Props) => {
  const [formData, setFormData] = useState<ProductCreate>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    image_url: '',
    category: '',
    is_active: true,
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
        await productAdminApi.update(product.id, updateData);
      } else {
        // 新增
        await productAdminApi.create(formData);
      }
      onClose(true);
    } catch (err: any) {
      alert(err.response?.data?.detail || '操作失败');
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