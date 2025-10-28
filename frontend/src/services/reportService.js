import api from './api';
import { API_ENDPOINTS } from '../config/api';

const reportService = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get(API_ENDPOINTS.REPORTS_DASHBOARD);
    return response.data.data || {};
  },

  // Revenue Analytics
  getRevenueByPeriod: async (params) => {
    const response = await api.get(API_ENDPOINTS.REPORTS_REVENUE_BY_PERIOD, { params });
    return response.data.data || [];
  },

  getRevenueByCustomer: async (params) => {
    const response = await api.get(API_ENDPOINTS.REPORTS_REVENUE_BY_CUSTOMER, { params });
    return response.data.data || [];
  },

  getRevenueByProduct: async (params) => {
    const response = await api.get(API_ENDPOINTS.REPORTS_REVENUE_BY_PRODUCT, { params });
    return response.data.data || [];
  },

  // Product Analytics
  getTopSellingProducts: async (params) => {
    const response = await api.get(API_ENDPOINTS.REPORTS_TOP_SELLING, { params });
    return response.data.data || [];
  },

  getSlowMovingProducts: async (params) => {
    const response = await api.get(API_ENDPOINTS.REPORTS_SLOW_MOVING, { params });
    return response.data.data || [];
  },

  getProductProfitability: async (params) => {
    const response = await api.get(API_ENDPOINTS.REPORTS_PROFITABILITY, { params });
    return response.data.data || [];
  },

  // Inventory Analytics
  getLowStockReport: async () => {
    const response = await api.get(API_ENDPOINTS.REPORTS_INVENTORY_LOW_STOCK);
    return response.data.data || [];
  },

  getInventoryValue: async () => {
    const response = await api.get(API_ENDPOINTS.REPORTS_INVENTORY_VALUE);
    return response.data.data || [];
  },

  getStockMovementReport: async (params) => {
    const response = await api.get(API_ENDPOINTS.REPORTS_STOCK_MOVEMENT, { params });
    return response.data.data || [];
  },
};

export default reportService;
