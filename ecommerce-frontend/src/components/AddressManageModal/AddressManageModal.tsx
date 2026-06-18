// src/components/AddressManageModal/AddressManageModal.tsx
import { useEffect, useState } from 'react';
import { addressApi } from '../../api/address';
import type { UserAddress } from '../../types/address';
import { PROVINCES, CITIES } from '../../data/regions';
import { useToast } from '../Toast';
import styles from './AddressManageModal.module.css';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const AddressManageModal = ({ visible, onClose }: Props) => {
  const toast = useToast();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<UserAddress | null>(null);
  const [showForm, setShowForm] = useState(false);

  // 表单
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [detail, setDetail] = useState('');
  const [recipient, setRecipient] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const fetchAddresses = async () => {
    setLoading(true);
    try { setAddresses(await addressApi.list()); } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (visible) fetchAddresses(); }, [visible]);

  const resetForm = () => {
    setProvince(''); setCity(''); setDetail(''); setRecipient(''); setPhone(''); setErr('');
    setEditing(null); setShowForm(false);
  };

  const openEdit = (addr: UserAddress) => {
    setEditing(addr);
    setProvince(addr.province);
    setCity(addr.city);
    setDetail(addr.detail);
    setRecipient(addr.recipient_name || '');
    setPhone(addr.recipient_phone || '');
    setShowForm(true);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!province || !city || !detail.trim()) { setErr('请完整填写省、市、详细地址'); return; }
    setSaving(true); setErr('');
    try {
      if (editing) {
        await addressApi.update(editing.id, { province, city, detail: detail.trim(), recipient_name: recipient.trim() || undefined, recipient_phone: phone.trim() || undefined });
        toast.success('地址已更新');
      } else {
        await addressApi.create({ province, city, detail: detail.trim(), recipient_name: recipient.trim() || undefined, recipient_phone: phone.trim() || undefined });
        toast.success('地址已添加');
      }
      resetForm();
      await fetchAddresses();
    } catch (e: any) { setErr(e.response?.data?.detail || '保存失败'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除该地址吗？')) return;
    try { await addressApi.delete(id); setAddresses(p => p.filter(a => a.id !== id)); toast.success('已删除'); }
    catch (e: any) { toast.error(e.response?.data?.detail || '删除失败'); }
  };

  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>管理地址</h3>
          <button className={styles.closeBtn} onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>
        <div className={styles.body}>
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border" style={{ color: 'var(--primary-container)' }} /></div>
          ) : (
            <>
              {addresses.map(addr => (
                <div key={addr.id} className={styles.addrItem}>
                  <div className={styles.addrInfo}>
                    <div>
                      <strong>{addr.recipient_name || '收件人'}</strong>
                      <span className={styles.phone}>{addr.recipient_phone || ''}</span>
                      {addr.is_default && <span className={styles.badge}>默认</span>}
                    </div>
                    <div className={styles.addrText}>{addr.province} {addr.city} {addr.detail}</div>
                  </div>
                  <div className={styles.addrActions}>
                    <button className={styles.editBtn} onClick={() => openEdit(addr)}><i className="bi bi-pencil" /></button>
                    <button className={styles.delBtn} onClick={() => handleDelete(addr.id)}><i className="bi bi-trash" /></button>
                  </div>
                </div>
              ))}
              {!showForm && (
                <button className={styles.addBtn} onClick={openAdd}>
                  <i className="bi bi-plus-circle" /> 添加新地址
                </button>
              )}
            </>
          )}

          {showForm && (
            <div className={styles.formCard}>
              <h4>{editing ? '编辑地址' : '添加新地址'}</h4>
              <div className="row mb-3">
                <div className="col-6"><label className="form-label small">收件人</label><input className="form-control form-control-sm" value={recipient} onChange={e => setRecipient(e.target.value)} /></div>
                <div className="col-6"><label className="form-label small">电话</label><input className="form-control form-control-sm" value={phone} onChange={e => setPhone(e.target.value)} /></div>
              </div>
              <div className="mb-3"><label className="form-label small">省</label>
                <select className="form-select form-select-sm" value={province} onChange={e => { setProvince(e.target.value); setCity(''); }}>
                  <option value="">请选择</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="mb-3"><label className="form-label small">市</label>
                <select className="form-select form-select-sm" value={city} onChange={e => setCity(e.target.value)} disabled={!province}>
                  <option value="">请选择</option>
                  {(CITIES[province] || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="mb-3"><label className="form-label small">详细地址</label><textarea className="form-control form-control-sm" rows={2} value={detail} onChange={e => setDetail(e.target.value)} /></div>
              {err && <div className="alert alert-danger small py-1">{err}</div>}
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-secondary" onClick={resetForm}>取消</button>
                <button className="btn btn-sm" style={{ background: 'var(--primary-container)', color: 'var(--on-primary-container)' }} onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressManageModal;
