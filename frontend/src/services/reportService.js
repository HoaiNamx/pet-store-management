import api from './api';
import { API_ENDPOINTS } from '../config/api';
import itemService from './itemService';
import customerService from './customerService';

const reportService = {
  // Dashboard
  getDashboard: async () => {
    // Fetch dashboard data and counts in parallel
    const [dashboardResponse, itemsData, customersData] = await Promise.all([
      api.get(API_ENDPOINTS.REPORTS_DASHBOARD),
      itemService.getAll({ page: 1, limit: 1 }), // Just to get pagination.total
      customerService.getAll({ page: 1, limit: 1 }) // Just to get pagination.total
    ]);

    const data = dashboardResponse.data.data || {};

    // Backend returns: { today, monthComparison, lowStockItems, topProducts, generatedAt }
    // NOTE: Backend field names are LOWERCASE (totalsales, totalrevenue, totalsold)

    const monthComparison = Array.isArray(data.monthComparison) ? data.monthComparison : [];
    const thisMonth = monthComparison.find(m => m.period === 'this_month') || {};

    // Transform low stock items from Sequelize models to flat objects
    const lowStockItems = Array.isArray(data.lowStockItems) ? data.lowStockItems.map(item => ({
      id: item.id,
      name: item.item?.name || 'Unknown',
      currentStock: item.quantity || 0,
      minStock: item.minStock || 0
    })) : [];

    // Transform top products (note: totalsold and totalrevenue are LOWERCASE in backend)
    const topProducts = Array.isArray(data.topProducts) ? data.topProducts.map(p => ({
      name: p.name,
      quantity: parseInt(p.totalsold || 0),  // lowercase from backend
      revenue: parseFloat(p.totalrevenue || 0)  // lowercase from backend
    })) : [];

    return {
      monthRevenue: parseFloat(thisMonth.totalrevenue || 0),  // lowercase from backend
      monthSales: parseInt(thisMonth.totalsales || 0),  // lowercase from backend
      totalProducts: itemsData.pagination?.total || 0, // From items API
      totalCustomers: customersData.pagination?.total || 0, // From customers API
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
    const data = response.data.data || [];

    // Transform backend field names to match frontend expectations
    if (Array.isArray(data)) {
      return data.map(item => ({
        customerId: item.customerId,
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        orderCount: parseInt(item.totalOrders || 0),  // Backend: totalOrders -> Frontend: orderCount
        totalRevenue: parseFloat(item.totalRevenue || 0),
        avgOrderValue: parseFloat(item.avgOrderValue || 0),
        lastPurchase: item.lastPurchase,
        firstPurchase: item.firstPurchase
      }));
    }
    return [];
  },

  getRevenueByProduct: async (params) => {
    const response = await api.get(API_ENDPOINTS.REPORTS_REVENUE_BY_PRODUCT, { params });
    const data = response.data.data || [];

    // Transform backend field names to match frontend expectations
    if (Array.isArray(data)) {
      return data.map(item => ({
        itemId: item.itemId,
        productName: item.itemName,  // Backend: itemName -> Frontend: productName
        itemCode: item.itemCode,
        itemTypeName: item.itemTypeName,
        quantitySold: parseInt(item.totalSold || 0),  // Backend: totalSold -> Frontend: quantitySold
        totalRevenue: parseFloat(item.totalRevenue || 0),
        avgSellingPrice: parseFloat(item.avgSellingPrice || 0),
        totalOrders: parseInt(item.totalOrders || 0),
        estimatedProfit: parseFloat(item.estimatedProfit || 0)
      }));
    }
    return [];
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
    const data = response.data.data || [];

    // Transform backend field names to match frontend expectations
    if (Array.isArray(data)) {
      return data.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        itemType: item.itemType,
        totalSold: parseInt(item.totalSold || 0),
        revenue: parseFloat(item.totalRevenue || 0),  // Backend: totalRevenue -> Frontend: revenue
        avgSellingPrice: parseFloat(item.avgSellingPrice || 0),
        cost: parseFloat(item.avgCostPrice || 0),  // Backend: avgCostPrice -> Frontend: cost
        profit: parseFloat(item.totalProfit || 0),  // Backend: totalProfit -> Frontend: profit
        margin: parseFloat(item.profitMarginPercent || 0)  // Backend: profitMarginPercent -> Frontend: margin
      }));
    }
    return [];
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
    const data = response.data.data || [];

    // Transform backend field names to match frontend expectations
    if (Array.isArray(data)) {
      return data.map(item => ({
        date: item.date,
        item: item.itemName,  // Backend: itemName -> Frontend: item
        itemCode: item.itemCode,
        type: item.movementType,  // Backend: movementType -> Frontend: type
        description: item.description,
        quantity: parseInt(item.quantity || 0),
        unitPrice: parseFloat(item.unitPrice || 0),
        totalAmount: parseFloat(item.totalAmount || 0),
        referenceCode: item.referenceCode
      }));
    }
    return [];
  },
};

export default reportService;
