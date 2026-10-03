import { api } from './client';

export const addressesApi = {
  async list() {
    const data = await api.get('/addresses');
    return data.data;
  },

  async get(id) {
    const data = await api.get(`/addresses/${id}`);
    return data.data;
  },

  async create(address) {
    const data = await api.post('/addresses', address);
    return data.data;
  },

  async update(id, address) {
    const data = await api.patch(`/addresses/${id}`, address);
    return data.data;
  },

  async remove(id) {
    const data = await api.delete(`/addresses/${id}`);
    return data.data;
  },

  async setDefault(id) {
    const data = await api.post(`/addresses/${id}/default`);
    return data.data;
  },
};