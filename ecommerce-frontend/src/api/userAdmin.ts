// src/api/userAdmin.ts
import apiClient from './client';
import type { User, UserCreate, UserUpdate, UserListResponse, UserSearchParams } from '../types/user';

export const userAdminApi = {
  // 获取用户列表（管理员）
  list: async (params: UserSearchParams): Promise<UserListResponse> => {
    const response = await apiClient.get('/admin/users/', { params });
    return response.data;
  },

  // 创建用户
  create: async (data: UserCreate): Promise<User> => {
    const response = await apiClient.post('/admin/users/', data);
    return response.data;
  },

  // 更新用户
  update: async (id: number, data: UserUpdate): Promise<User> => {
    const response = await apiClient.put(`/admin/users/${id}`, data);
    return response.data;
  },

  // 删除用户
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`);
  },

  // 切换启用/禁用状态
  toggleStatus: async (id: number, is_active: boolean): Promise<User> => {
    const response = await apiClient.patch(`/admin/users/${id}/toggle-status`, null, {
      params: { is_active }
    });
    return response.data;
  },

  // 重置密码（可选）
  resetPassword: async (id: number, newPassword: string): Promise<void> => {
    await apiClient.post(`/admin/users/${id}/reset-password`, { password: newPassword });
  }
};