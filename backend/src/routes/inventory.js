const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// All routes are public - no authentication needed
router.get('/', inventoryController.getAll);
router.get('/low-stock', inventoryController.getLowStock);
router.get('/stock-in-history', inventoryController.getStockInHistory);
router.get('/item/:itemId', inventoryController.getByItemId);

router.post('/stock-in', inventoryController.stockIn);
router.post('/adjust', inventoryController.adjustInventory);
router.put('/min-stock/:itemId', inventoryController.updateMinStock);

module.exports = router;