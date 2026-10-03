import { api } from './client';

export const adminApi = {
  async dashboard() {
    const data = await api.get('/admin/dashboard');
    return data.data;
  },

  async salesReport(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, value);
      }
    });
    const data = await api.get(`/admin/reports/sales?${search.toString()}`);
    return data.data;
  },

  async ordersReport(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, value);
      }
    });
    const data = await api.get(`/admin/reports/orders?${search.toString()}`);
    return data.data;
  },

  async productsReport(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, value);
      }
    });
    const data = await api.get(`/admin/reports/products?${search.toString()}`);
    return data.data;
  },

  async categoriesReport(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, value);
      }
    });
    const data = await api.get(`/admin/reports/categories?${search.toString()}`);
    return data.data;
  },

  async listOrders(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, value);
      }
    });
    const data = await api.get(`/admin/orders?${search.toString()}`);
    return data.data;
  },

  async getOrder(id) {
    const data = await api.get(`/admin/orders/${id}`);
    return data.data;
  },

  async updateOrderStatus(id, { status, note }) {
    const data = await api.patch(`/admin/orders/${id}/status`, { status, note });
    return data.data;
  },

  async listCustomers(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, value);
      }
    });
    const data = await api.get(`/admin/customers?${search.toString()}`);
    return data.data;
  },

  async getCustomer(id) {
    const data = await api.get(`/admin/customers/${id}`);
    return data.data;
  },

  async setCustomerActive(id, isActive) {
    const data = await api.patch(`/admin/customers/${id}/status`, { isActive });
    return data.data;
  },

  async updateUserRole(id, role) {
    const data = await api.patch(`/admin/customers/${id}/role`, { role });
    return data.data;
  },

  async listInventory(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, value);
      }
    });
    const data = await api.get(`/admin/inventory?${search.toString()}`);
    return data.data;
  },

  async listMovements(variantId) {
    const data = await api.get(`/admin/inventory/${variantId}/movements`);
    return data.data;
  },

  async adjustStock(variantId, { quantity, reason, note }) {
    const data = await api.post(`/admin/inventory/${variantId}/adjust`, { quantity, reason, note });
    return data.data;
  },

  async setStock(variantId, { stockQuantity }) {
    const data = await api.put(`/admin/inventory/${variantId}/stock`, { stockQuantity });
    return data.data;
  },

  async listProducts(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, value);
      }
    });
    const data = await api.get(`/admin/products?${search.toString()}`);
    return data.data;
  },

  async getProduct(id) {
    const data = await api.get(`/admin/products/${id}`);
    return data.data;
  },

  async createProduct(product) {
    const data = await api.post('/admin/products', product);
    return data.data;
  },

  async updateProduct(id, product) {
    const data = await api.patch(`/admin/products/${id}`, product);
    return data.data;
  },

  async deleteProduct(id) {
    const data = await api.delete(`/admin/products/${id}`);
    return data.data;
  },

  async restoreProduct(id) {
    const data = await api.post(`/admin/products/${id}/restore`);
    return data.data;
  },

  async setProductFlags(id, { isFeatured, isActive }) {
    const data = await api.patch(`/admin/products/${id}/flags`, { isFeatured, isActive });
    return data.data;
  },

  async createCategory(category) {
    const data = await api.post('/admin/categories', category);
    return data.data;
  },

  async updateCategory(id, category) {
    const data = await api.patch(`/admin/categories/${id}`, category);
    return data.data;
  },

  async deleteCategory(id) {
    const data = await api.delete(`/admin/categories/${id}`);
    return data.data;
  },

  async listSettings() {
    const data = await api.get('/admin/settings');
    return data.data;
  },

  async getSetting(key) {
    const data = await api.get(`/admin/settings/${key}`);
    return data.data;
  },

  async upsertSetting(key, value) {
    const data = await api.put(`/admin/settings/${key}`, { value });
    return data.data;
  },
};