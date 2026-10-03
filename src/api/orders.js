import { api } from './client';

export const ordersApi = {
  async create(input) {
    const data = await api.post('/orders', input);
    return data.data;
  },

  async list(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, value);
      }
    });
    const data = await api.get(`/orders?${search.toString()}`);
    return data.data;
  },

  async get(id) {
    const data = await api.get(`/orders/${id}`);
    return data.data;
  },

  async cancel(id) {
    const data = await api.post(`/orders/${id}/cancel`);
    return data.data;
  },
};