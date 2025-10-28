import api from './api';
import { API_ENDPOINTS } from '../config/api';

const reportService = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get(API_ENDPOINTS.REPORTS_DASHBOARD);
    const data = response.data.data || {};

    // Transform backend data structure to match frontend expectations
    const monthComparison = Array.isArray(data.monthComparison) ? data.monthComparison : [];
    const thisMonth = monthComparison.find(m => m.period === 'this_month') || {};

    // Transform low stock items from Sequelize models to flat objects
    const lowStockItems = Array.isArray(data.lowStockItems) ? data.lowStockItems.map(item => ({
      id: item.id,
      name: item.item?.name || item.Item?.name || 'Unknown',
      currentStock: item.quantity || 0,
      minStock: item.minStock || item.min_stock || 0
    })) : [];

    // Transform top products
    const topProducts = Array.isArray(data.topProducts) ? data.topProducts.map(p => ({
      name: p.name,
      quantity: parseInt(p.totalSold || 0),
      revenue: parseFloat(p.totalRevenue || 0)
    })) : [];

    return {
      monthRevenue: parseFloat(thisMonth.totalRevenue || 0),
      monthSales: parseInt(thisMonth.totalSales || 0),
      totalProducts: 0, // Will need backend to provide this
      totalCustomers: 0, // Will need backend to provide this
      revenueChart: [], // Backend doesn't provide this yet
      topProducts,
      lowStockItems
    };
  },

  // Revenue Analytics
  getRevenueByPeriod: async (params) => {
    const response = await api.get(API_ENDPOINTS.REPORTS_REVENUE_BY_PERIOD, { params });
    const data = response.data.data || {};

    // Backend returns object with results array
    if (data.results && Array.isArray(data.results)) {
      // Transform to match frontend expectations (rename 'period' to 'date', 'totalRevenue' to 'revenue')
      return data.results.map(item => ({
        date: item.period,
        revenue: parseFloat(item.totalRevenue || 0),
        sales: parseInt(item.totalSales || 0)
      }));
    }
    return [];
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
    const data = response.data.data || [];

    // Transform to match frontend expectations (rename 'totalSold' to 'quantity')
    if (Array.isArray(data)) {
      return data.map(item => ({
        ...item,
        quantity: parseInt(item.totalSold || 0)
      }));
    }
    return [];
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
    const data = response.data.data || [];

    // Transform Sequelize models to flat objects
    if (Array.isArray(data)) {
      return data.map(item => ({
        id: item.id,
        name: item.item?.name || item.Item?.name || 'Unknown',
        currentStock: item.quantity || 0,
        minStock: item.minStock || item.min_stock || 0
      }));
    }
    return [];
  },

  getInventoryValue: async () => {
    const response = await api.get(API_ENDPOINTS.REPORTS_INVENTORY_VALUE);
    const data = response.data.data || {};

    // Backend returns object with byCategory array, extract it
    if (data.byCategory && Array.isArray(data.byCategory)) {
      return data.byCategory;
    }
    return [];
  },

  getStockMovementReport: async (params) => {
    const response = await api.get(API_ENDPOINTS.REPORTS_STOCK_MOVEMENT, { params });
    return response.data.data || [];
  },
};

export default reportService;
