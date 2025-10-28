import api from './api';
import { API_ENDPOINTS } from '../config/api';

const salesService = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.SALES, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.SALES}/${id}`);
    return response.data;
  },

  getSummary: async (params) => {
    const response = await api.get(API_ENDPOINTS.SALES_SUMMARY, { params });
    return response.data;
  },

  create: async (saleData) => {
    const response = await api.post(API_ENDPOINTS.SALES, saleData);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.put(`${API_ENDPOINTS.SALES}/${id}/cancel`);
    return response.data;
  },
};

export default salesService;
