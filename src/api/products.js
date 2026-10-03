import { api } from './client';

export const productsApi = {
  async list(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, value);
      }
    });
    const data = await api.get(`/products?${search.toString()}`);
    return data.data;
  },

  async getBySlug(slug) {
    const data = await api.get(`/products/${slug}`);
    return data.data;
  },

  async getRelated(id) {
    const data = await api.get(`/products/${id}/related`);
    return data.data;
  },

  async getCategories() {
    const data = await api.get('/products/categories');
    return data.data;
  },

  async getCategory(slug) {
    const data = await api.get(`/products/categories/${slug}`);
    return data.data;
  },

  async checkoutSummary() {
    const data = await api.get('/checkout');
    return data.data;
  },
};