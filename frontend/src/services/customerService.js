import api from './api';
import { API_ENDPOINTS } from '../config/api';

const customerService = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.CUSTOMERS, { params });
    // Backend returns { success: true, data: { customers: [...], pagination: {...} } }
    const data = response.data.data || {};
    return {
      customers: data.customers || [],
      pagination: data.pagination || { current: 1, limit: 10, total: 0, pages: 0 }
    };
  },

  getById: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.CUSTOMERS}/${id}`);
    return response.data.data;
  },

  getAnalytics: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.CUSTOMERS}/${id}/analytics`);
    return response.data.data;
  },

  search: async (searchTerm) => {
    const response = await api.get(API_ENDPOINTS.CUSTOMERS_SEARCH, {
      params: { q: searchTerm },
    });
    const data = response.data.data || {};
    return {
      customers: data.customers || [],
      pagination: data.pagination || { current: 1, limit: 10, total: 0, pages: 0 }
    };
  },

  create: async (customerData) => {
    const response = await api.post(API_ENDPOINTS.CUSTOMERS, customerData);
    return response.data.data;
  },

  update: async (id, customerData) => {
    const response = await api.put(`${API_ENDPOINTS.CUSTOMERS}/${id}`, customerData);
    return response.data.data;
  },

  delete: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.CUSTOMERS}/${id}`);
    return response.data.data;
  },
};

export default customerService;
