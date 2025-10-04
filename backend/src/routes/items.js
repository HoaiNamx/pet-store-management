const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// All routes are public - no authentication needed
router.get('/', itemController.getAll);
router.get('/search', itemController.search);
router.get('/low-stock', itemController.getLowStock);
router.get('/:id', itemController.getById);
router.post('/', itemController.create);
router.put('/:id', itemController.update);
router.delete('/:id', itemController.delete);

module.exports = router;