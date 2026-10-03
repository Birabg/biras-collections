import { api } from './client';

export const cartApi = {
  async get() {
    const data = await api.get('/cart');
    return data.data;
  },

  async add({ productId, variantId, quantity = 1 }) {
    const data = await api.post('/cart', { productId, variantId, quantity });
    return data.data;
  },

  async update(id, { quantity }) {
    const data = await api.patch(`/cart/${id}`, { quantity });
    return data.data;
  },

  async remove(id) {
    const data = await api.delete(`/cart/${id}`);
    return data.data;
  },

  async clear() {
    const data = await api.delete('/cart');
    return data.data;
  },
};