import api from './api';
import { API_ENDPOINTS } from '../config/api';

const itemService = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.ITEMS, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.ITEMS}/${id}`);
    return response.data;
  },

  search: async (searchTerm) => {
    const response = await api.get(API_ENDPOINTS.ITEMS_SEARCH, {
      params: { q: searchTerm },
    });
    return response.data;
  },

  getLowStock: async () => {
    const response = await api.get(API_ENDPOINTS.ITEMS_LOW_STOCK);
    return response.data;
  },

  create: async (itemData) => {
    const response = await api.post(API_ENDPOINTS.ITEMS, itemData);
    return response.data;
  },

  update: async (id, itemData) => {
    const response = await api.put(`${API_ENDPOINTS.ITEMS}/${id}`, itemData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.ITEMS}/${id}`);
    return response.data;
  },
};

export default itemService;
