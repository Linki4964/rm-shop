// src/components/UserFormModal/UserFormModal.tsx
import React, { useEffect, useState } from "react";
import { userAdminApi } from "../../api/userAdmin";
import type { User, UserCreate, UserUpdate } from "../../types/user";
import styles from "./UserFormModal.module.css";
import {
  validateEmail,
  validateUsername,
  validatePassword,
} from "../../utils/validators";

interface UserFormModalProps {
  visible: boolean;
  onClose: (refetch?: boolean) => void;
  user?: User | null;
}

const UserFormModal = ({ visible, onClose, user }: UserFormModalProps) => {
  const [formData, setFormData] = useState<UserCreate | UserUpdate>({
    email: "",
    username: "",
    password: "",
    full_name: "",
    is_active: true,
    is_superuser: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      // 编辑模式：回填现有数据（密码字段留空）
      setFormData({
        email: user.email,
        username: user.username,
        full_name: user.full_name || "",
        is_active: user.is_active,
        is_superuser: user.is_superuser,
      });
    } else {
      // 新增模式：重置表单
      setFormData({
        email: "",
        username: "",
        password: "",
        full_name: "",
        is_active: true,
        is_superuser: false,
      });
    }
    setError("");
  }, [user, visible]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 1. 邮箱验证
    const emailError = validateEmail((formData as any).email);
    if (emailError) {
      setError(emailError);
      return;
    }

    // 2. 用户名验证
    const usernameError = validateUsername((formData as any).username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    // 3. 密码验证（新增时必填，编辑时可选但若填写则需符合规则）
    const isRequired = !user; // true: 新增模式，密码必填；false: 编辑模式，密码可选
    const passwordValue = (formData as UserCreate | UserUpdate).password || "";
    const passwordError = validatePassword(passwordValue, isRequired);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      if (user) {
        // 编辑
        const updateData: UserUpdate = { ...formData };
        if ("password" in updateData && updateData.password === "") {
          delete updateData.password;
        }
        await userAdminApi.update(user.id, updateData);
      } else {
        // 新增
        await userAdminApi.create(formData as UserCreate);
      }
      onClose(true); // 关闭并刷新列表
    } catch (err: any) {
      setError(err.response?.data?.detail || "操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h5 className={styles.title}>{user ? "编辑用户" : "新增用户"}</h5>
          <button className={styles.closeBtn} onClick={() => onClose(false)}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>邮箱 *</label>
              <input
                type="email"
                name="email"
                className={styles.inputControl}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>用户名 *</label>
              <input
                type="text"
                name="username"
                className={styles.inputControl}
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            {!user && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>密码 *</label>
                <input
                  type="password"
                  name="password"
                  className={styles.inputControl}
                  value={(formData as UserCreate).password || ""}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
            {user && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>新密码（留空不修改）</label>
                <input
                  type="password"
                  name="password"
                  className={styles.inputControl}
                  value={(formData as UserUpdate).password || ""}
                  onChange={handleChange}
                />
              </div>
            )}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>姓名</label>
              <input
                type="text"
                name="full_name"
                className={styles.inputControl}
                value={formData.full_name || ""}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                启用账户
              </label>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_superuser"
                  checked={formData.is_superuser}
                  onChange={handleChange}
                />
                超级管理员
              </label>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => onClose(false)}
            >
              取消
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;