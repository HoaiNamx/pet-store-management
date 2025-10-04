const express = require('express');
const router = express.Router();
const itemTypeController = require('../controllers/itemTypeController');

// All routes are now public - no authentication needed
router.get('/', itemTypeController.getAll);
router.get('/active', itemTypeController.getActive);
router.get('/:id', itemTypeController.getById);
router.post('/', itemTypeController.create);
router.put('/:id', itemTypeController.update);
router.delete('/:id', itemTypeController.delete);

module.exports = router;