import api from './api';
import { API_ENDPOINTS } from '../config/api';

const itemService = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.ITEMS, { params });
    // Backend returns { success: true, data: { items: [...], pagination: {...} } }
    const data = response.data.data || {};
    return {
      items: data.items || [],
      pagination: data.pagination || { current: 1, limit: 10, total: 0, pages: 0 }
    };
  },

  getById: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.ITEMS}/${id}`);
    return response.data.data;
  },

  search: async (searchTerm, params = {}) => {
    const response = await api.get(API_ENDPOINTS.ITEMS_SEARCH, {
      params: { q: searchTerm, ...params },
    });
    const data = response.data.data || {};
    return {
      items: data.items || [],
      pagination: data.pagination || { current: 1, limit: 10, total: 0, pages: 0 }
    };
  },

  getLowStock: async () => {
    const response = await api.get(API_ENDPOINTS.ITEMS_LOW_STOCK);
    return response.data.data || [];
  },

  create: async (itemData) => {
    const response = await api.post(API_ENDPOINTS.ITEMS, itemData);
    return response.data.data;
  },

  update: async (id, itemData) => {
    const response = await api.put(`${API_ENDPOINTS.ITEMS}/${id}`, itemData);
    return response.data.data;
  },

  delete: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.ITEMS}/${id}`);
    return response.data.data;
  },
};

export default itemService;
