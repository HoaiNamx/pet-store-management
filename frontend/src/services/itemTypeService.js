import api from './api';
import { API_ENDPOINTS } from '../config/api';

const itemTypeService = {
  getAll: async () => {
    const response = await api.get(API_ENDPOINTS.ITEM_TYPES);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.ITEM_TYPES}/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.ITEM_TYPES, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`${API_ENDPOINTS.ITEM_TYPES}/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.ITEM_TYPES}/${id}`);
    return response.data;
  },
};

export default itemTypeService;
