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
    // NOTE: Backend SQL returns lowercase field names (totalrevenue, totalsales, etc.)
    if (data.results && Array.isArray(data.results)) {
      // Transform to match frontend expectations (rename 'period' to 'date', 'totalrevenue' to 'revenue')
      return data.results.map(item => ({
        date: item.period,
        revenue: parseFloat(item.totalrevenue || 0),  // Backend: totalrevenue (lowercase)
        sales: parseInt(item.totalsales || 0)  // Backend: totalsales (lowercase)
      }));
    }
    return [];
  },

  getRevenueByCustomer: async (params) => {
    const response = await api.get(API_ENDPOINTS.REPORTS_REVENUE_BY_CUSTOMER, { params });
    const data = response.data.data || [];

    // Transform backend field names to match frontend expectations
    // NOTE: Backend SQL returns lowercase field names (customerid, customername, etc.)
    if (Array.isArray(data)) {
      return data.map(item => ({
        customerId: item.customerid || item.customerId,  // Backend: customerid (lowercase)
        customerName: item.customername || item.customerName,  // Backend: customername (lowercase)
        customerPhone: item.customerphone || item.customerPhone,  // Backend: customerphone (lowercase)
        orderCount: parseInt(item.totalorders || item.totalOrders || 0),  // Backend: totalorders (lowercase) -> Frontend: orderCount
        totalRevenue: parseFloat(item.totalrevenue || item.totalRevenue || 0),  // Backend: totalrevenue (lowercase)
        avgOrderValue: parseFloat(item.avgordervalue || item.avgOrderValue || 0),  // Backend: avgordervalue (lowercase)
        lastPurchase: item.lastpurchase || item.lastPurchase,  // Backend: lastpurchase (lowercase)
        firstPurchase: item.firstpurchase || item.firstPurchase  // Backend: firstpurchase (lowercase)
      }));
    }
    return [];
  },

  getRevenueByProduct: async (params) => {
    const response = await api.get(API_ENDPOINTS.REPORTS_REVENUE_BY_PRODUCT, { params });
    const data = response.data.data || [];

    // Transform backend field names to match frontend expectations
    // NOTE: Backend SQL returns lowercase field names (itemid, itemname, etc.)
    if (Array.isArray(data)) {
      return data.map(item => ({
        itemId: item.itemid || item.itemId,  // Backend: itemid (lowercase)
        productName: item.itemname || item.itemName,  // Backend: itemname (lowercase) -> Frontend: productName
        itemCode: item.itemcode || item.itemCode,  // Backend: itemcode (lowercase)
        itemTypeName: item.itemtypename || item.itemTypeName,  // Backend: itemtypename (lowercase)
        quantitySold: parseInt(item.totalsold || item.totalSold || 0),  // Backend: totalsold (lowercase) -> Frontend: quantitySold
        totalRevenue: parseFloat(item.totalrevenue || item.totalRevenue || 0),  // Backend: totalrevenue (lowercase)
        avgSellingPrice: parseFloat(item.avgsellingprice || item.avgSellingPrice || 0),  // Backend: avgsellingprice (lowercase)
        totalOrders: parseInt(item.totalorders || item.totalOrders || 0),  // Backend: totalorders (lowercase)
        estimatedProfit: parseFloat(item.estimatedprofit || item.estimatedProfit || 0)  // Backend: estimatedprofit (lowercase)
      }));
    }
    return [];
  },

  // Product Analytics
  getTopSellingProducts: async (params) => {
    const response = await api.get(API_ENDPOINTS.REPORTS_TOP_SELLING, { params });
    const data = response.data.data || [];

    // Transform to match frontend expectations (rename 'totalsold' to 'quantity')
    // NOTE: Backend SQL returns lowercase field names (totalsold, totalrevenue, etc.)
    if (Array.isArray(data)) {
      return data.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        itemType: item.itemtype || item.itemType,  // Backend: itemtype (lowercase)
        quantity: parseInt(item.totalsold || item.totalSold || 0),  // Backend: totalsold (lowercase) -> Frontend: quantity
        totalRevenue: parseFloat(item.totalrevenue || item.totalRevenue || 0),  // Backend: totalrevenue (lowercase)
        totalOrders: parseInt(item.totalorders || item.totalOrders || 0),  // Backend: totalorders (lowercase)
        avgPrice: parseFloat(item.avgprice || item.avgPrice || 0),  // Backend: avgprice (lowercase)
        currentStock: parseInt(item.currentstock || item.currentStock || 0)  // Backend: currentstock (lowercase)
      }));
    }
    return [];
  },

  getSlowMovingProducts: async (params) => {
    const response = await api.get(API_ENDPOINTS.REPORTS_SLOW_MOVING, { params });
    const data = response.data.data || [];

    // Transform backend field names to match frontend expectations
    // NOTE: Backend SQL returns lowercase field names (currentstock, avgcost, etc.)
    if (Array.isArray(data)) {
      return data.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        itemType: item.itemtype || item.itemType,  // Backend: itemtype (lowercase)
        currentStock: parseInt(item.currentstock || item.currentStock || 0),  // Backend: currentstock (lowercase)
        avgCost: parseFloat(item.avgcost || item.avgCost || 0),  // Backend: avgcost (lowercase)
        sellingPrice: parseFloat(item.sellingprice || item.sellingPrice || 0),  // Backend: sellingprice (lowercase)
        soldInPeriod: parseInt(item.soldinperiod || item.soldInPeriod || 0),  // Backend: soldinperiod (lowercase)
        lastSaleDate: item.lastsaledate || item.lastSaleDate,  // Backend: lastsaledate (lowercase)
        stockValue: parseFloat(item.stockvalue || item.stockValue || 0)  // Backend: stockvalue (lowercase)
      }));
    }
    return [];
  },

  getProductProfitability: async (params) => {
    const response = await api.get(API_ENDPOINTS.REPORTS_PROFITABILITY, { params });
    const data = response.data.data || [];

    // Transform backend field names to match frontend expectations
    // NOTE: Backend SQL returns lowercase field names (totalsold, totalrevenue, etc.)
    if (Array.isArray(data)) {
      return data.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        itemType: item.itemtype || item.itemType,  // Backend: itemtype (lowercase)
        totalSold: parseInt(item.totalsold || item.totalSold || 0),  // Backend: totalsold (lowercase)
        revenue: parseFloat(item.totalrevenue || item.totalRevenue || 0),  // Backend: totalrevenue (lowercase) -> Frontend: revenue
        avgSellingPrice: parseFloat(item.avgsellingprice || item.avgSellingPrice || 0),  // Backend: avgsellingprice (lowercase)
        cost: parseFloat(item.avgcostprice || item.avgCostPrice || 0),  // Backend: avgcostprice (lowercase) -> Frontend: cost
        profit: parseFloat(item.totalprofit || item.totalProfit || 0),  // Backend: totalprofit (lowercase) -> Frontend: profit
        margin: parseFloat(item.profitmarginpercent || item.profitMarginPercent || 0)  // Backend: profitmarginpercent (lowercase) -> Frontend: margin
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
    // NOTE: Backend SQL returns lowercase field names (itemtype, totalitems, etc.)
    if (data.byCategory && Array.isArray(data.byCategory)) {
      return data.byCategory.map(item => ({
        itemType: item.itemtype || item.itemType,  // Backend: itemtype (lowercase)
        totalItems: parseInt(item.totalitems || item.totalItems || 0),  // Backend: totalitems (lowercase)
        totalQuantity: parseInt(item.totalquantity || item.totalQuantity || 0),  // Backend: totalquantity (lowercase)
        avgCostPrice: parseFloat(item.avgcostprice || item.avgCostPrice || 0),  // Backend: avgcostprice (lowercase)
        totalValue: parseFloat(item.totalvalue || item.totalValue || 0)  // Backend: totalvalue (lowercase)
      }));
    }
    return [];
  },

  getStockMovementReport: async (params) => {
    const response = await api.get(API_ENDPOINTS.REPORTS_STOCK_MOVEMENT, { params });
    const data = response.data.data || [];

    // Transform backend field names to match frontend expectations
    // NOTE: Backend SQL returns lowercase field names (itemname, movementtype, etc.)
    if (Array.isArray(data)) {
      return data.map(item => ({
        date: item.date,
        item: item.itemname || item.itemName,  // Backend: itemname (lowercase) -> Frontend: item
        itemCode: item.itemcode || item.itemCode,  // Backend: itemcode (lowercase)
        type: item.movementtype || item.movementType,  // Backend: movementtype (lowercase) -> Frontend: type
        description: item.description,
        quantity: parseInt(item.quantity || 0),
        unitPrice: parseFloat(item.unitprice || item.unitPrice || 0),  // Backend: unitprice (lowercase)
        totalAmount: parseFloat(item.totalamount || item.totalAmount || 0),  // Backend: totalamount (lowercase)
        referenceCode: item.referencecode || item.referenceCode  // Backend: referencecode (lowercase)
      }));
    }
    return [];
  },
};

export default reportService;
