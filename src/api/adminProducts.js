import { api } from './client';

export const adminProductsApi = {
  async list(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.set(key, String(value));
      }
    });
    const data = await api.get(`/admin/products?${search.toString()}`);
    return data;
  },

  async get(id) {
    const data = await api.get(`/admin/products/${id}`);
    return data.data;
  },

  async create(product) {
    const data = await api.post('/admin/products', product);
    return data.data;
  },

  async update(id, product) {
    const data = await api.patch(`/admin/products/${id}`, product);
    return data.data;
  },

  async delete(id) {
    const data = await api.delete(`/admin/products/${id}`);
    return data.data;
  },

  async restore(id) {
    const data = await api.post(`/admin/products/${id}/restore`);
    return data.data;
  },

  async setFlags(id, flags) {
    const data = await api.patch(`/admin/products/${id}/flags`, flags);
    return data.data;
  },
};

export const adminCategoriesApi = {
  async list() {
    const data = await api.get('/admin/categories');
    return data.data;
  },

  async create(category) {
    const data = await api.post('/admin/categories', category);
    return data.data;
  },

  async update(id, category) {
    const data = await api.patch(`/admin/categories/${id}`, category);
    return data.data;
  },

  async delete(id) {
    const data = await api.delete(`/admin/categories/${id}`);
    return data.data;
  },
};