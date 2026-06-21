import apiClient from './client';
import type { User, UserUpdate } from '../types/user';

export const userProfileApi = {
  update: async (data: UserUpdate): Promise<User> => {
    const response = await apiClient.patch('/auth/me', data);
    return response.data;
  }
};
