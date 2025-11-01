require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import database
const sequelize = require('./config/database');

// Import models and associations
require('./models');

// Import routes
// const authRoutes = require('./routes/auth'); // Removed - No authentication needed
const itemTypeRoutes = require('./routes/itemTypes');
const itemRoutes = require('./routes/items');
const customerRoutes = require('./routes/customers');
const inventoryRoutes = require('./routes/inventory');
const salesRoutes = require('./routes/sales');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS Configuration - IMPROVED
const corsOptions = {
    origin: function (origin, callback) {
        // Allowed origins list
        const allowedOrigins = [
            'http://localhost:3000',              // Local development
            'http://localhost:3001',              // Alternative local port
            'https://elegant-boba-2ca7b8.netlify.app',  // Production Netlify
            process.env.FRONTEND_URL              // Production URL from env
        ].filter(Boolean); // Remove undefined values

        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) {
            return callback(null, true);
        }

        // Check if origin is allowed
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // Also allow any Netlify preview/branch deployments
            if (origin && origin.includes('.netlify.app')) {
                return callback(null, true);
            }

            // In production, log the rejected origin for debugging
            console.log('CORS rejected origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // Cache preflight request for 24 hours
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers (basic)
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Request logging in development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
    });
}

// Static files (uploads)
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Create required directories
const requiredDirs = ['../uploads', '../logs', '../backups', '../database'];
requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});

// API Routes
// app.use('/api/auth', authRoutes); // Removed - No authentication needed
app.use('/api/item-types', itemTypeRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportRoutes);

// Seed endpoint (for initial database setup)
app.post('/api/seed', async (req, res) => {
    try {
        // Simple security check
        const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Invalid admin key'
            });
        }

        // Run seed
        const seedData = require('./config/seed');
        await seedData();

        res.json({
            success: true,
            message: 'Database seeded successfully',
            credentials: {
                username: 'admin',
                password: 'admin123'
            }
        });
    } catch (error) {
        console.error('Seed endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to seed database',
            error: error.message
        });
    }
});

// Health check endpoint - ENHANCED
app.get('/api/health', async (req, res) => {
    try {
        // Test database connection
        await sequelize.authenticate();

        // Get database file size (for SQLite)
        let dbSize = 'N/A';
        const dbPath = path.join(__dirname, '../database/database.sqlite');
        if (fs.existsSync(dbPath)) {
            const stats = fs.statSync(dbPath);
            dbSize = `${(stats.size / 1024 / 1024).toFixed(2)} MB`;
        }

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            database: {
                status: 'connected',
                type: 'SQLite',
                size: dbSize
            },
            server: {
                port: PORT,
                uptime: process.uptime(),
                memory: {
                    used: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
                    total: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`
                }
            }
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Pet Store API Server',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            items: '/api/items',
            customers: '/api/customers',
            sales: '/api/sales',
            reports: '/api/reports'
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((error, req, res, next) => {
    // Log error details
    console.error('=== ERROR ===');
    console.error('Time:', new Date().toISOString());
    console.error('Method:', req.method);
    console.error('URL:', req.originalUrl);
    console.error('Error:', error.stack || error);
    console.error('=============');

    // Send appropriate response
    const statusCode = error.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message;

    res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && {
            error: error.message,
            stack: error.stack
        })
    });
});

// Initialize database and start server
const initializeApp = async () => {
    try {
        console.log('🔄 Starting server initialization...');

        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');

        // Sync database (create tables if not exist)
        // In production, use migrations instead of sync
        if (process.env.NODE_ENV === 'production') {
            // Don't alter schema in production
            await sequelize.sync({ alter: false });
        } else {
            // In development, can alter schema
            await sequelize.sync({ alter: true });
        }
        console.log('✅ Database synchronized successfully.');

        // Start server
        const server = app.listen(PORT, () => {
            console.log('====================================');
            console.log(`🚀 Server running successfully!`);
            console.log(`📍 Port: ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🏠 Base URL: http://localhost:${PORT}`);
            console.log(`💓 Health check: http://localhost:${PORT}/api/health`);
            console.log('====================================');
        });

        // Set timeout for production
        if (process.env.NODE_ENV === 'production') {
            // 30 seconds timeout
            server.timeout = 30000;
        }

    } catch (error) {
        console.error('❌ Unable to start server:', error);
        console.error('Please check your database configuration and environment variables.');
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // Give time to log before exit
    setTimeout(() => process.exit(1), 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // Give time to log before exit
    setTimeout(() => process.exit(1), 1000);
});

// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n⏳ ${signal} received, starting graceful shutdown...`);

    try {
        // Close database connection
        await sequelize.close();
        console.log('✅ Database connection closed.');

        // Exit process
        console.log('👋 Server shutdown complete. Goodbye!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the application
initializeApp();