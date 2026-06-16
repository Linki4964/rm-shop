// src/pages/admin/Products.tsx
import { useEffect, useState, useCallback } from 'react';
import { productAdminApi, productPublicApi } from '../../api/productAdmin';
import type  { Product, ProductSearchParams } from '../../types/product';
import ProductFormModal from '../../components/ProductFormModal/ProductFormModal';
import styles from './Products.module.css';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [categories, setCategories] = useState<string[]>([]);

  // 筛选状态
  const [filters, setFilters] = useState<{
    keyword: string;
    category: string;
    is_active: string;
    min_price: string;
    max_price: string;
  }>({
    keyword: '',
    category: '',
    is_active: '',
    min_price: '',
    max_price: '',
  });

  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // 加载分类列表
  useEffect(() => {
    productPublicApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  // 加载商品列表
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: ProductSearchParams = {
        page,
        size,
        keyword: filters.keyword || undefined,
        category: filters.category || undefined,
        is_active:
          filters.is_active === '' ? undefined : filters.is_active === 'true',
        min_price: filters.min_price ? Number(filters.min_price) : undefined,
        max_price: filters.max_price ? Number(filters.max_price) : undefined,
        sort_by: 'created_at',
        sort_order: 'desc',
      };
      const res = await productAdminApi.list(params);
      setProducts(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
      alert('加载商品列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, size, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 处理删除
  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除该商品吗？')) return;
    try {
      await productAdminApi.delete(id);
      fetchProducts();
    } catch (err) {
      alert('删除失败');
    }
  };

  // 切换上架状态
  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await productAdminApi.toggleStatus(id, !currentStatus);
      fetchProducts();
    } catch (err) {
      alert('操作失败');
    }
  };

  // 打开编辑模态框
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setModalVisible(true);
  };

  // 关闭模态框并刷新
  const handleModalClose = (refetch = false) => {
    setModalVisible(false);
    setEditingProduct(null);
    if (refetch) fetchProducts();
  };

  // 快速更新库存（简单弹窗输入）
  const handleUpdateStock = async (id: number, currentStock: number) => {
    const newStock = window.prompt('请输入新库存数量', String(currentStock));
    if (newStock === null) return;
    const stockNum = parseInt(newStock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      alert('请输入非负整数');
      return;
    }
    try {
      await productAdminApi.updateStock(id, stockNum);
      fetchProducts();
    } catch (err) {
      alert('更新库存失败');
    }
  };

  // 筛选变更处理
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // 重置页码
  };

  const totalPages = Math.ceil(total / size);

  return (
    <div className={styles.container}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold">商品管理</h3>
        <button
          className="btn btn-danger"
          onClick={() => {
            setEditingProduct(null);
            setModalVisible(true);
          }}
        >
          + 新增商品
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="card mb-4 p-3">
        <div className="row g-3">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="商品名称/描述"
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">全部分类</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              value={filters.is_active}
              onChange={(e) => handleFilterChange('is_active', e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="true">上架</option>
              <option value="false">下架</option>
            </select>
          </div>
          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              placeholder="最低价"
              value={filters.min_price}
              onChange={(e) => handleFilterChange('min_price', e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              placeholder="最高价"
              value={filters.max_price}
              onChange={(e) => handleFilterChange('max_price', e.target.value)}
            />
          </div>
          <div className="col-md-1">
            <button className="btn btn-outline-secondary w-100" onClick={() => fetchProducts()}>
              搜索
            </button>
          </div>
        </div>
      </div>

      {/* 商品表格 */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" />
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>商品名称</th>
                  <th>价格</th>
                  <th>库存</th>
                  <th>分类</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>
                      <div className="fw-bold">{product.name}</div>
                      <div className="small text-muted">
                        {product.description?.substring(0, 50)}
                      </div>
                    </td>
                    <td>¥{product.price}</td>
                    <td>{product.stock}</td>
                    <td>{product.category || '-'}</td>
                    <td>
                      <span
                        className={`badge ${
                          product.is_active ? 'bg-success' : 'bg-secondary'
                        }`}
                      >
                        {product.is_active ? '上架' : '下架'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => handleEdit(product)}
                      >
                        编辑
                      </button>
                      <button
                        className="btn btn-sm btn-outline-warning me-1"
                        onClick={() =>
                          handleUpdateStock(product.id, product.stock)
                        }
                      >
                        库存
                      </button>
                      <button
                        className="btn btn-sm btn-outline-info me-1"
                        onClick={() =>
                          handleToggleStatus(product.id, product.is_active)
                        }
                      >
                        {product.is_active ? '下架' : '上架'}
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(product.id)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted">
                      暂无商品数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <nav>
              <ul className="pagination justify-content-center">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage((p) => p - 1)}
                  >
                    上一页
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <li
                      key={p}
                      className={`page-item ${page === p ? 'active' : ''}`}
                    >
                      <button className="page-link" onClick={() => setPage(p)}>
                        {p}
                      </button>
                    </li>
                  )
                )}
                <li
                  className={`page-item ${
                    page === totalPages ? 'disabled' : ''
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setPage((p) => p + 1)}
                  >
                    下一页
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}

      {/* 新增/编辑模态框 */}
      <ProductFormModal
        visible={modalVisible}
        onClose={handleModalClose}
        product={editingProduct}
        categories={categories}
      />
    </div>
  );
};

export default Products;