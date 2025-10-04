const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);

// Health check
router.get('/health', (req, res) => {
    res.json({
        message: 'Auth routes working',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;