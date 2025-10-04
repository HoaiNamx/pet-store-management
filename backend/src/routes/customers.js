const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// All routes are public - no authentication needed
router.get('/', customerController.getAll);
router.get('/search', customerController.search);
router.get('/:id', customerController.getById);
router.get('/:id/analytics', customerController.getAnalytics);
router.post('/', customerController.create);
router.put('/:id', customerController.update);
router.delete('/:id', customerController.delete);

module.exports = router;