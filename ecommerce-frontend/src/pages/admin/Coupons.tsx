import { useEffect, useState } from 'react';

import { couponAdminApi, type CouponAdminItem } from '../../api/coupon';
import { useToast, useConfirm } from '../../components/Toast';

type CouponFormState = {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  is_active: boolean;
  usage_limit: number;
  expires_at: string;
};

const emptyForm: CouponFormState = {
  code: '',
  discount_type: 'fixed',
  discount_value: 10,
  min_order_amount: 0,
  is_active: true,
  usage_limit: 0,
  expires_at: '',
};

const Coupons = () => {
  const [items, setItems] = useState<CouponAdminItem[]>([]);
  const [form, setForm] = useState<CouponFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const load = async () => {
    try {
      setItems(await couponAdminApi.list());
    } catch {
      toast.error('加载优惠券失败');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    try {
      const payload = {
        ...form,
        expires_at: form.expires_at || null,
      };
      if (editingId) await couponAdminApi.update(editingId, payload);
      else await couponAdminApi.create(payload);
      setForm(emptyForm);
      setEditingId(null);
      toast.success(editingId ? '优惠券已更新' : '优惠券已创建');
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '保存失败');
    }
  };

  const remove = async (id: number) => {
    const ok = await confirm({ message: '确定删除这张优惠券吗？' });
    if (!ok) return;
    try {
      await couponAdminApi.delete(id);
      toast.success('已删除');
      await load();
    } catch {
      toast.error('删除失败');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">优惠券管理</h3>
        <span className="text-muted">普通用户只能领取管理员创建的优惠券</span>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3"><input className="form-control" placeholder="券码" value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} /></div>
            <div className="col-md-2">
              <select className="form-select" value={form.discount_type} onChange={(e) => setForm((prev) => ({ ...prev, discount_type: e.target.value as 'percentage' | 'fixed' }))}>
                <option value="fixed">满减券</option>
                <option value="percentage">折扣券</option>
              </select>
            </div>
            <div className="col-md-2"><input type="number" className="form-control" placeholder="优惠值" value={form.discount_value} onChange={(e) => setForm((prev) => ({ ...prev, discount_value: Number(e.target.value) }))} /></div>
            <div className="col-md-2"><input type="number" className="form-control" placeholder="使用门槛" value={form.min_order_amount} onChange={(e) => setForm((prev) => ({ ...prev, min_order_amount: Number(e.target.value) }))} /></div>
            <div className="col-md-1"><input type="number" className="form-control" placeholder="限量" value={form.usage_limit} onChange={(e) => setForm((prev) => ({ ...prev, usage_limit: Number(e.target.value) }))} /></div>
            <div className="col-md-2"><input type="datetime-local" className="form-control" value={form.expires_at} onChange={(e) => setForm((prev) => ({ ...prev, expires_at: e.target.value }))} /></div>
            <div className="col-md-2 d-flex align-items-center"><div className="form-check"><input className="form-check-input" type="checkbox" checked={form.is_active} onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))} /><label className="form-check-label">启用</label></div></div>
            <div className="col-md-10" />
            <div className="col-md-2 d-flex gap-2">
              <button className="btn btn-danger w-100" onClick={submit}>{editingId ? '更新' : '新增'}</button>
              {editingId && <button className="btn btn-outline-secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>取消</button>}
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>券码</th>
              <th>类型</th>
              <th>优惠</th>
              <th>门槛</th>
              <th>已用/总量</th>
              <th>有效期</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="fw-bold">{item.code}</td>
                <td>{item.discount_type === 'percentage' ? '折扣券' : '满减券'}</td>
                <td>{item.discount_type === 'percentage' ? `${item.discount_value}%` : `￥${item.discount_value}`}</td>
                <td>￥{item.min_order_amount}</td>
                <td>{item.used_count} / {item.usage_limit || '不限'}</td>
                <td>{item.expires_at ? new Date(item.expires_at).toLocaleString() : '长期有效'}</td>
                <td><span className={`badge ${item.is_active ? 'bg-success' : 'bg-secondary'}`}>{item.is_active ? '启用' : '停用'}</span></td>
                <td className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => {
                    setEditingId(item.id);
                    setForm({
                      code: item.code,
                      discount_type: item.discount_type,
                      discount_value: item.discount_value,
                      min_order_amount: item.min_order_amount,
                      is_active: item.is_active,
                      usage_limit: item.usage_limit,
                      expires_at: item.expires_at ? item.expires_at.slice(0, 16) : '',
                    });
                  }}>编辑</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => remove(item.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Coupons;
