import api from './api';
import { API_ENDPOINTS } from '../config/api';

const salesService = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.SALES, { params });
    // Backend returns { success: true, data: { sales: [...], pagination: {...} } }
    return response.data.data || { sales: [], pagination: { total: 0, pages: 0, current: 1, limit: 10 } };
  },

  getById: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.SALES}/${id}`);
    return response.data.data;
  },

  getSummary: async (params) => {
    const response = await api.get(API_ENDPOINTS.SALES_SUMMARY, { params });
    return response.data.data;
  },

  create: async (saleData) => {
    const response = await api.post(API_ENDPOINTS.SALES, saleData);
    return response.data.data;
  },

  cancel: async (id) => {
    const response = await api.put(`${API_ENDPOINTS.SALES}/${id}/cancel`);
    return response.data.data;
  },
};

export default salesService;
