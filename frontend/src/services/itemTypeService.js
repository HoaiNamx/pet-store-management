import api from './api';
import { API_ENDPOINTS } from '../config/api';

const itemTypeService = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.ITEM_TYPES, { params });
    // Backend returns { success: true, data: { itemTypes: [...], pagination: {...} } }
    const data = response.data.data || {};
    return {
      itemTypes: data.itemTypes || [],
      pagination: data.pagination || { current: 1, limit: 10, total: 0, pages: 0 }
    };
  },

  getById: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.ITEM_TYPES}/${id}`);
    return response.data.data;
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.ITEM_TYPES, data);
    return response.data.data;
  },

  update: async (id, data) => {
    const response = await api.put(`${API_ENDPOINTS.ITEM_TYPES}/${id}`, data);
    return response.data.data;
  },

  delete: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.ITEM_TYPES}/${id}`);
    return response.data.data;
  },
};

export default itemTypeService;
