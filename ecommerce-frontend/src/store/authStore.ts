import { create } from 'zustand';
import apiClient from '../api/client';

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, full_name?: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({

  token: localStorage.getItem('access_token'),
  user: null,
  isLoading: false,

  // 登录：只存 token，不获取用户信息
  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      // 调用API接口
      const response = await apiClient.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token } = response.data;

      // 保存 token
      localStorage.setItem('access_token', access_token);
      set({ token: access_token });
      // 注意：不在这里调用 fetchUser
    } catch (error) {
      // 登录失败，仅清除存储，不触发任何跳转
      localStorage.removeItem('access_token');
      set({ token: null, user: null });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // 获取用户信息（需要有效 token）
  fetchUser: async () => {
    const token = get().token || localStorage.getItem('access_token');
    if (!token) return;
    set({ isLoading: true });
    try {
      // 调用API接口
      const response = await apiClient.get('/auth/me');
      set({ user: response.data });
    } catch {
      localStorage.removeItem('access_token');
      set({ token: null, user: null });
      throw new Error('获取用户信息失败');
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, username, password, full_name = '') => {
    set({ isLoading: true });
    try {
      // 调用API接口
      await apiClient.post('/auth/register', { email, username, password, full_name });
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ token: null, user: null });
  }
}));

// 页面启动时，如果有 token 则尝试获取用户信息（静默失败）
const token = localStorage.getItem('access_token');
if (token) {
  useAuthStore.getState().fetchUser().catch(() => { });
}