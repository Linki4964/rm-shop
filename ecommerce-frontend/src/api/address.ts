import apiClient from './client';
import type { UserAddress, AddressCreate } from '../types/address';

export const addressApi = {
  list: async (): Promise<UserAddress[]> => {
    const response = await apiClient.get('/addresses/');
    return response.data;
  },

  create: async (data: AddressCreate): Promise<UserAddress> => {
    const response = await apiClient.post('/addresses/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<AddressCreate>): Promise<UserAddress> => {
    const response = await apiClient.put(`/addresses/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/addresses/${id}`);
  },
};
