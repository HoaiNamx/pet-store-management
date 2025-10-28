import api from './api';
import { API_ENDPOINTS } from '../config/api';

const inventoryService = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.INVENTORY, { params });
    return response.data.data?.inventory || response.data.data || [];
  },

  getByItemId: async (itemId) => {
    const response = await api.get(`${API_ENDPOINTS.INVENTORY}/item/${itemId}`);
    return response.data.data;
  },

  getLowStock: async () => {
    const response = await api.get(API_ENDPOINTS.INVENTORY_LOW_STOCK);
    return response.data.data || [];
  },

  getStockInHistory: async (params) => {
    const response = await api.get(API_ENDPOINTS.INVENTORY_STOCK_IN_HISTORY, { params });
    return response.data.data?.stockIns || response.data.data || [];
  },

  stockIn: async (data) => {
    const response = await api.post(API_ENDPOINTS.INVENTORY_STOCK_IN, data);
    return response.data.data;
  },

  adjustInventory: async (data) => {
    const response = await api.post(API_ENDPOINTS.INVENTORY_ADJUST, data);
    return response.data.data;
  },

  updateMinStock: async (itemId, minStock) => {
    const response = await api.put(`${API_ENDPOINTS.INVENTORY}/min-stock/${itemId}`, {
      minStock,
    });
    return response.data.data;
  },
};

export default inventoryService;
