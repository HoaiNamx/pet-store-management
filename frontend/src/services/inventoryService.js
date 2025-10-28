import api from './api';
import { API_ENDPOINTS } from '../config/api';

const inventoryService = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.INVENTORY, { params });
    return response.data;
  },

  getByItemId: async (itemId) => {
    const response = await api.get(`${API_ENDPOINTS.INVENTORY}/item/${itemId}`);
    return response.data;
  },

  getLowStock: async () => {
    const response = await api.get(API_ENDPOINTS.INVENTORY_LOW_STOCK);
    return response.data;
  },

  getStockInHistory: async (params) => {
    const response = await api.get(API_ENDPOINTS.INVENTORY_STOCK_IN_HISTORY, { params });
    return response.data;
  },

  stockIn: async (data) => {
    const response = await api.post(API_ENDPOINTS.INVENTORY_STOCK_IN, data);
    return response.data;
  },

  adjustInventory: async (data) => {
    const response = await api.post(API_ENDPOINTS.INVENTORY_ADJUST, data);
    return response.data;
  },

  updateMinStock: async (itemId, minStock) => {
    const response = await api.put(`${API_ENDPOINTS.INVENTORY}/min-stock/${itemId}`, {
      minStock,
    });
    return response.data;
  },
};

export default inventoryService;
