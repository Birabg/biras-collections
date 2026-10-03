import { api } from './client';

export const wishlistApi = {
  async get() {
    const data = await api.get('/wishlist');
    return data.data;
  },

  async add({ productId }) {
    const data = await api.post('/wishlist', { productId });
    return data.data;
  },

  async remove(productId) {
    const data = await api.delete('/wishlist', { productId });
    return data.data;
  },

  async toggle({ productId }) {
    const data = await api.post('/wishlist/toggle', { productId });
    return data.data;
  },

  async check(productId) {
    const data = await api.get(`/wishlist/${productId}`);
    return data.data;
  },

  async clear() {
    const data = await api.delete('/wishlist/all');
    return data.data;
  },
};