const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Dashboard overview
router.get('/dashboard', reportController.getDashboard);

// Revenue Analytics (FR-08)
router.get('/revenue/by-period', reportController.getRevenueByPeriod);
router.get('/revenue/by-customer', reportController.getRevenueByCustomer);
router.get('/revenue/by-product', reportController.getRevenueByProduct);

// Product Analytics (FR-09)
router.get('/products/top-selling', reportController.getTopSellingProducts);
router.get('/products/slow-moving', reportController.getSlowMovingProducts);
router.get('/products/profitability', reportController.getProductProfitability);

// Inventory Analytics (FR-10)
router.get('/inventory/low-stock', reportController.getLowStockReport);
router.get('/inventory/value', reportController.getInventoryValue);
router.get('/inventory/stock-movement', reportController.getStockMovementReport);

module.exports = router;