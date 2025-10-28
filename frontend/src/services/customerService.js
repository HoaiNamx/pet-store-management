import api from './api';
import { API_ENDPOINTS } from '../config/api';

const customerService = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.CUSTOMERS, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.CUSTOMERS}/${id}`);
    return response.data;
  },

  getAnalytics: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.CUSTOMERS}/${id}/analytics`);
    return response.data;
  },

  search: async (searchTerm) => {
    const response = await api.get(API_ENDPOINTS.CUSTOMERS_SEARCH, {
      params: { q: searchTerm },
    });
    return response.data;
  },

  create: async (customerData) => {
    const response = await api.post(API_ENDPOINTS.CUSTOMERS, customerData);
    return response.data;
  },

  update: async (id, customerData) => {
    const response = await api.put(`${API_ENDPOINTS.CUSTOMERS}/${id}`, customerData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.CUSTOMERS}/${id}`);
    return response.data;
  },
};

export default customerService;
