const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

// All routes are public - no authentication needed
router.get('/', salesController.getAll);
router.get('/summary', salesController.getSummary);
router.get('/:id', salesController.getById);

router.post('/', salesController.create);
router.put('/:id/cancel', salesController.cancel);

module.exports = router;