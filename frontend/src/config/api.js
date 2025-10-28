// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/auth/profile',

  // Items
  ITEMS: '/items',
  ITEMS_SEARCH: '/items/search',
  ITEMS_LOW_STOCK: '/items/low-stock',

  // Item Types
  ITEM_TYPES: '/item-types',

  // Customers
  CUSTOMERS: '/customers',
  CUSTOMERS_SEARCH: '/customers/search',

  // Inventory
  INVENTORY: '/inventory',
  INVENTORY_LOW_STOCK: '/inventory/low-stock',
  INVENTORY_STOCK_IN: '/inventory/stock-in',
  INVENTORY_STOCK_IN_HISTORY: '/inventory/stock-in-history',
  INVENTORY_ADJUST: '/inventory/adjust',

  // Sales
  SALES: '/sales',
  SALES_SUMMARY: '/sales/summary',

  // Reports
  REPORTS_DASHBOARD: '/reports/dashboard',
  REPORTS_REVENUE_BY_PERIOD: '/reports/revenue/by-period',
  REPORTS_REVENUE_BY_CUSTOMER: '/reports/revenue/by-customer',
  REPORTS_REVENUE_BY_PRODUCT: '/reports/revenue/by-product',
  REPORTS_TOP_SELLING: '/reports/products/top-selling',
  REPORTS_SLOW_MOVING: '/reports/products/slow-moving',
  REPORTS_PROFITABILITY: '/reports/products/profitability',
  REPORTS_INVENTORY_LOW_STOCK: '/reports/inventory/low-stock',
  REPORTS_INVENTORY_VALUE: '/reports/inventory/value',
  REPORTS_STOCK_MOVEMENT: '/reports/inventory/stock-movement',
};

export default API_BASE_URL;
