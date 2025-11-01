const { Sale, SaleDetail, Customer, Item, ItemType, Inventory, StockIn, StockInDetail } = require('../models');
const Joi = require('joi');
const { Op, QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

// Validation schemas
const dateRangeSchema = Joi.object({
    fromDate: Joi.date().optional(),
    toDate: Joi.date().optional(),
    period: Joi.string().valid('today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year').optional(),
    _t: Joi.number().optional() // Cache busting timestamp
}).unknown(true); // Allow additional parameters

const revenueByPeriodSchema = Joi.object({
    fromDate: Joi.date().optional(),
    toDate: Joi.date().optional(),
    period: Joi.string().valid('today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year').optional(),
    groupBy: Joi.string().valid('hour', 'day', 'week', 'month', 'year').optional().default('day'),
    _t: Joi.number().optional() // Cache busting timestamp
}).unknown(true); // Allow additional parameters

const basicReportParamsSchema = Joi.object({
    fromDate: Joi.date().optional(),
    toDate: Joi.date().optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    itemTypeId: Joi.number().integer().optional(),
    itemId: Joi.number().integer().optional(),
    days: Joi.number().integer().min(1).max(365).optional(),
    _t: Joi.number().optional() // Cache busting timestamp
}).unknown(true); // Allow additional parameters

const reportController = {
    // ======================
    // DASHBOARD OVERVIEW
    // ======================
    getDashboard: async (req, res) => {
        try {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

            // Today's stats
            const [todayStats] = await sequelize.query(`
                SELECT 
                    COUNT(*) as totalSales,
                    COALESCE(SUM(final_amount), 0) as totalRevenue,
                    COALESCE(AVG(final_amount), 0) as avgOrderValue
                FROM sales 
                WHERE DATE(sale_date) = DATE('${today.toISOString().split('T')[0]}')
                AND status = 'completed'
            `, { type: QueryTypes.SELECT });

            // This month vs last month
            const [monthComparison] = await sequelize.query(`
                SELECT 
                    'this_month' as period,
                    COUNT(*) as totalSales,
                    COALESCE(SUM(final_amount), 0) as totalRevenue
                FROM sales 
                WHERE sale_date >= '${thisMonth.toISOString()}'
                AND status = 'completed'
                UNION ALL
                SELECT 
                    'last_month' as period,
                    COUNT(*) as totalSales,
                    COALESCE(SUM(final_amount), 0) as totalRevenue
                FROM sales 
                WHERE sale_date >= '${lastMonth.toISOString()}'
                AND sale_date < '${thisMonth.toISOString()}'
                AND status = 'completed'
            `);

            // Low stock items
            const lowStockItems = await Inventory.findAll({
                where: {
                    [Op.or]: [
                        { quantity: { [Op.lte]: { [Op.col]: 'min_stock' } } },
                        { quantity: 0 }
                    ]
                },
                include: [{
                    model: Item,
                    as: 'item',
                    attributes: ['name', 'code'],
                    where: { isActive: true }
                }],
                order: [['quantity', 'ASC']],
                limit: 10
            });

            // Top selling products today
            const [topProducts] = await sequelize.query(`
                SELECT 
                    i.name,
                    SUM(sd.quantity) as totalSold,
                    SUM(sd.subtotal) as totalRevenue
                FROM sale_details sd
                JOIN items i ON sd.item_id = i.id
                JOIN sales s ON sd.sale_id = s.id
                WHERE DATE(s.sale_date) = DATE('${today.toISOString().split('T')[0]}')
                AND s.status = 'completed'
                GROUP BY i.id, i.name
                ORDER BY totalSold DESC
                LIMIT 5
            `);

            res.json({
                success: true,
                data: {
                    today: todayStats,
                    monthComparison,
                    lowStockItems,
                    topProducts,
                    generatedAt: new Date()
                }
            });

        } catch (error) {
            console.error('Get dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // ======================
    // REVENUE ANALYTICS (FR-08)
    // ======================

    // FR-08.1: Revenue by time periods
    getRevenueByPeriod: async (req, res) => {
        try {
            const { error } = revenueByPeriodSchema.validate(req.query);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const { fromDate, toDate, period = 'this_month', groupBy = 'day' } = req.query;

            let dateFilter = '';
            let groupByClause = '';

            // Build date filter
            if (fromDate && toDate) {
                dateFilter = `sale_date >= '${fromDate} 00:00:00' AND sale_date <= '${toDate} 23:59:59'`;
            } else {
                // Predefined periods
                const today = new Date();
                switch (period) {
                    case 'today':
                        const todayStart = today.toISOString().split('T')[0];
                        dateFilter = `DATE(sale_date) = '${todayStart}'`;
                        break;
                    case 'yesterday':
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        const yesterdayStr = yesterday.toISOString().split('T')[0];
                        dateFilter = `DATE(sale_date) = '${yesterdayStr}'`;
                        break;
                    case 'this_week':
                        const weekStart = new Date(today);
                        weekStart.setDate(today.getDate() - today.getDay());
                        dateFilter = `sale_date >= '${weekStart.toISOString().split('T')[0]} 00:00:00'`;
                        break;
                    case 'this_month':
                        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                        dateFilter = `sale_date >= '${monthStart.toISOString().split('T')[0]} 00:00:00'`;
                        break;
                    case 'this_year':
                        const yearStart = new Date(today.getFullYear(), 0, 1);
                        dateFilter = `sale_date >= '${yearStart.toISOString().split('T')[0]} 00:00:00'`;
                        break;
                    default:
                        // Default to this month if no period specified
                        const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);
                        dateFilter = `sale_date >= '${defaultStart.toISOString().split('T')[0]} 00:00:00'`;
                }
            }

            // Build group by clause
            switch (groupBy) {
                case 'hour':
                    groupByClause = `DATE_FORMAT(sale_date, '%Y-%m-%d %H:00:00')`;
                    break;
                case 'day':
                    groupByClause = `DATE(sale_date)`;
                    break;
                case 'week':
                    groupByClause = `YEARWEEK(sale_date)`;
                    break;
                case 'month':
                    groupByClause = `DATE_FORMAT(sale_date, '%Y-%m')`;
                    break;
                case 'year':
                    groupByClause = `YEAR(sale_date)`;
                    break;
                default:
                    groupByClause = `DATE(sale_date)`;
            }

            const [results] = await sequelize.query(`
                SELECT 
                    ${groupByClause} as period,
                    COUNT(*) as totalSales,
                    SUM(final_amount) as totalRevenue,
                    SUM(discount) as totalDiscount,
                    AVG(final_amount) as avgOrderValue,
                    COUNT(DISTINCT customer_id) as uniqueCustomers
                FROM sales 
                WHERE ${dateFilter} AND status = 'completed'
                GROUP BY ${groupByClause}
                ORDER BY period ASC
            `);

            res.json({
                success: true,
                data: {
                    results,
                    summary: {
                        totalRevenue: results.reduce((sum, item) => sum + parseFloat(item.totalRevenue || 0), 0),
                        totalSales: results.reduce((sum, item) => sum + parseInt(item.totalSales || 0), 0),
                        avgOrderValue: results.length > 0 ?
                            results.reduce((sum, item) => sum + parseFloat(item.avgOrderValue || 0), 0) / results.length : 0
                    }
                }
            });

        } catch (error) {
            console.error('Get revenue by period error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // FR-08.2: Revenue by customer
    getRevenueByCustomer: async (req, res) => {
        try {
            const { error } = basicReportParamsSchema.validate(req.query);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }
            const { fromDate, toDate, limit = 20 } = req.query;

            let dateFilter = '';
            if (fromDate || toDate) {
                dateFilter = 'WHERE ';
                const conditions = [];
                if (fromDate) conditions.push(`s.sale_date >= '${fromDate} 00:00:00'`);  // ← Add time
                if (toDate) conditions.push(`s.sale_date <= '${toDate} 23:59:59'`);
                conditions.push(`s.status = 'completed'`);
                dateFilter += conditions.join(' AND ');
            } else {
                dateFilter = `WHERE s.status = 'completed'`;
            }

            const [results] = await sequelize.query(`
                SELECT 
                    COALESCE(c.id, 0) as customerId,
                    COALESCE(c.name, 'Khách lẻ') as customerName,
                    COALESCE(c.phone, '') as customerPhone,
                    COUNT(*) as totalOrders,
                    SUM(s.final_amount) as totalRevenue,
                    AVG(s.final_amount) as avgOrderValue,
                    MAX(s.sale_date) as lastPurchase,
                    MIN(s.sale_date) as firstPurchase
                FROM sales s
                LEFT JOIN customers c ON s.customer_id = c.id
                ${dateFilter}
                GROUP BY COALESCE(c.id, 0), COALESCE(c.name, 'Khách lẻ'), COALESCE(c.phone, '')
                ORDER BY totalRevenue DESC
                LIMIT ${parseInt(limit)}
            `);

            res.json({
                success: true,
                data: results
            });

        } catch (error) {
            console.error('Get revenue by customer error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // FR-08.3: Revenue by product
    getRevenueByProduct: async (req, res) => {
        try {
            const { fromDate, toDate, itemTypeId, limit = 20 } = req.query;

            let dateFilter = 'WHERE s.status = \'completed\'';
            if (fromDate) dateFilter += ` AND s.sale_date >= '${fromDate} 00:00:00'`;  // ← Add time
            if (toDate) dateFilter += ` AND s.sale_date <= '${toDate} 23:59:59'`;
            if (itemTypeId) dateFilter += ` AND i.item_type_id = ${itemTypeId}`;

            const [results] = await sequelize.query(`
                SELECT 
                    i.id as itemId,
                    i.name as itemName,
                    i.code as itemCode,
                    it.name as itemTypeName,
                    SUM(sd.quantity) as totalSold,
                    SUM(sd.subtotal) as totalRevenue,
                    AVG(sd.unit_price) as avgSellingPrice,
                    COUNT(DISTINCT s.id) as totalOrders,
                    (SUM(sd.subtotal) - SUM(sd.quantity * COALESCE(inv.avg_cost, 0))) as estimatedProfit
                FROM sale_details sd
                JOIN items i ON sd.item_id = i.id
                JOIN item_types it ON i.item_type_id = it.id
                JOIN sales s ON sd.sale_id = s.id
                LEFT JOIN inventory inv ON i.id = inv.item_id
                ${dateFilter}
                GROUP BY i.id, i.name, i.code, it.name
                ORDER BY totalRevenue DESC
                LIMIT ${parseInt(limit)}
            `);

            res.json({
                success: true,
                data: results
            });

        } catch (error) {
            console.error('Get revenue by product error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // ======================
    // PRODUCT ANALYTICS (FR-09)
    // ======================

    // FR-09.1: Top selling products
    getTopSellingProducts: async (req, res) => {
        try {
            const { fromDate, toDate, limit = 10, itemTypeId } = req.query;

            let dateFilter = 'WHERE s.status = \'completed\'';
            if (fromDate) dateFilter += ` AND s.sale_date >= '${fromDate} 00:00:00'`;
            if (toDate) dateFilter += ` AND s.sale_date <= '${toDate} 23:59:59'`;
            if (itemTypeId) dateFilter += ` AND i.item_type_id = ${itemTypeId}`;

            const [results] = await sequelize.query(`
                SELECT
                    i.id,
                    i.name,
                    i.code,
                    it.name as itemType,
                    SUM(sd.quantity) as totalSold,
                    SUM(sd.subtotal) as totalRevenue,
                    COUNT(DISTINCT s.id) as totalOrders,
                    AVG(sd.unit_price) as avgPrice,
                    COALESCE(MAX(inv.quantity), 0) as currentStock
                FROM sale_details sd
                JOIN items i ON sd.item_id = i.id
                JOIN item_types it ON i.item_type_id = it.id
                JOIN sales s ON sd.sale_id = s.id
                LEFT JOIN inventory inv ON i.id = inv.item_id
                ${dateFilter}
                GROUP BY i.id, i.name, i.code, it.name
                ORDER BY totalSold DESC
                LIMIT ${parseInt(limit)}
            `);

            res.json({
                success: true,
                data: results
            });

        } catch (error) {
            console.error('Get top selling products error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // FR-09.2: Slow moving products
    getSlowMovingProducts: async (req, res) => {
        try {
            const { days = 30, limit = 20 } = req.query;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

            const [results] = await sequelize.query(`
                SELECT
                    i.id,
                    i.name,
                    i.code,
                    it.name as itemType,
                    COALESCE(inv.quantity, 0) as currentStock,
                    COALESCE(inv.avg_cost, 0) as avgCost,
                    i.selling_price as sellingPrice,
                    COALESCE(recent_sales.totalSold, 0) as soldInPeriod,
                    recent_sales.lastSaleDate as lastSaleDate,
                    (COALESCE(inv.quantity, 0) * COALESCE(inv.avg_cost, 0)) as stockValue
                FROM items i
                JOIN item_types it ON i.item_type_id = it.id
                LEFT JOIN inventory inv ON i.id = inv.item_id
                LEFT JOIN (
                    SELECT
                        sd.item_id,
                        SUM(sd.quantity) as totalSold,
                        MAX(s.sale_date) as lastSaleDate
                    FROM sale_details sd
                    JOIN sales s ON sd.sale_id = s.id
                    WHERE s.sale_date >= '${cutoffDate.toISOString()}'
                    AND s.status = 'completed'
                    GROUP BY sd.item_id
                ) recent_sales ON i.id = recent_sales.item_id
                WHERE i.is_active = 1
                AND (recent_sales.totalSold IS NULL OR recent_sales.totalSold <= 2)
                AND COALESCE(inv.quantity, 0) > 0
                ORDER BY soldInPeriod ASC, COALESCE(inv.quantity, 0) DESC
                LIMIT ${parseInt(limit)}
            `);

            res.json({
                success: true,
                data: results,
                meta: {
                    periodDays: days,
                    cutoffDate: cutoffDate.toISOString()
                }
            });

        } catch (error) {
            console.error('Get slow moving products error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // FR-09.3: Product profitability
    getProductProfitability: async (req, res) => {
        try {
            const { fromDate, toDate, limit = 20 } = req.query;

            let dateFilter = 'WHERE s.status = \'completed\'';
            if (fromDate) dateFilter += ` AND s.sale_date >= '${fromDate} 00:00:00'`;
            if (toDate) dateFilter += ` AND s.sale_date <= '${toDate} 23:59:59'`;

            const [results] = await sequelize.query(`
                SELECT
                    i.id,
                    i.name,
                    i.code,
                    it.name as itemType,
                    SUM(sd.quantity) as totalSold,
                    SUM(sd.subtotal) as totalRevenue,
                    AVG(sd.unit_price) as avgSellingPrice,
                    COALESCE(AVG(sd.cost_price), MAX(inv.avg_cost), 0) as avgCostPrice,
                    SUM(sd.subtotal) - SUM(sd.quantity * COALESCE(sd.cost_price, MAX(inv.avg_cost), 0)) as totalProfit,
                    ((AVG(sd.unit_price) - COALESCE(AVG(sd.cost_price), MAX(inv.avg_cost), 0)) / NULLIF(AVG(sd.unit_price), 0) * 100) as profitMarginPercent
                FROM sale_details sd
                JOIN items i ON sd.item_id = i.id
                JOIN item_types it ON i.item_type_id = it.id
                JOIN sales s ON sd.sale_id = s.id
                LEFT JOIN inventory inv ON i.id = inv.item_id
                ${dateFilter}
                GROUP BY i.id, i.name, i.code, it.name
                HAVING totalSold > 0
                ORDER BY totalProfit DESC
                LIMIT ${parseInt(limit)}
            `);

            res.json({
                success: true,
                data: results
            });

        } catch (error) {
            console.error('Get product profitability error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // ======================
    // INVENTORY ANALYTICS (FR-10)
    // ======================

    // FR-10.1: Low stock report
    getLowStockReport: async (req, res) => {
        try {
            const results = await Inventory.findAll({
                where: {
                    [Op.or]: [
                        { quantity: { [Op.lte]: { [Op.col]: 'min_stock' } } },
                        { quantity: 0 }
                    ]
                },
                include: [{
                    model: Item,
                    as: 'item',
                    include: [{
                        model: ItemType,
                        as: 'itemType',
                        attributes: ['name']
                    }]
                }],
                order: [['quantity', 'ASC']]
            });

            res.json({
                success: true,
                data: results
            });

        } catch (error) {
            console.error('Get low stock report error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // FR-10.3: Current inventory value
    getInventoryValue: async (req, res) => {
        try {
            const [results] = await sequelize.query(`
                SELECT
                    it.name as itemType,
                    COUNT(DISTINCT i.id) as totalItems,
                    COALESCE(SUM(inv.quantity), 0) as totalQuantity,
                    COALESCE(SUM(inv.quantity * COALESCE(inv.avg_cost, 0)), 0) as totalValue,
                    COALESCE(AVG(COALESCE(inv.avg_cost, 0)), 0) as avgCostPrice
                FROM inventory inv
                JOIN items i ON inv.item_id = i.id
                JOIN item_types it ON i.item_type_id = it.id
                WHERE i.is_active = 1
                GROUP BY it.id, it.name
                ORDER BY totalValue DESC
            `);

            const [summary] = await sequelize.query(`
                SELECT
                    COUNT(DISTINCT i.id) as totalProducts,
                    COALESCE(SUM(inv.quantity), 0) as totalQuantity,
                    COALESCE(SUM(inv.quantity * COALESCE(inv.avg_cost, 0)), 0) as totalValue,
                    COUNT(CASE WHEN inv.quantity <= inv.min_stock THEN 1 END) as lowStockItems,
                    COUNT(CASE WHEN inv.quantity = 0 THEN 1 END) as outOfStockItems
                FROM inventory inv
                JOIN items i ON inv.item_id = i.id
                WHERE i.is_active = 1
            `, { type: QueryTypes.SELECT });

            res.json({
                success: true,
                data: {
                    byCategory: results,
                    summary: summary
                }
            });

        } catch (error) {
            console.error('Get inventory value error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // FR-10.4: Stock movement report
    getStockMovementReport: async (req, res) => {
        try {
            const { fromDate, toDate, itemId, limit = 50 } = req.query;

            let dateFilter = '';
            const conditions = [];
            if (fromDate) conditions.push(`date >= '${fromDate} 00:00:00'`);
            if (toDate) conditions.push(`date <= '${toDate} 23:59:59'`);
            if (itemId) conditions.push(`item_id = ${itemId}`);

            if (conditions.length > 0) {
                dateFilter = 'WHERE ' + conditions.join(' AND ');
            }

            const [results] = await sequelize.query(`
                SELECT * FROM (
                    -- Stock In movements
                    SELECT
                        sid.item_id,
                        i.name as itemName,
                        i.code as itemCode,
                        'IN' as movementType,
                        'Stock In' as description,
                        sid.quantity as quantity,
                        sid.cost_price as unitPrice,
                        sid.subtotal as totalAmount,
                        si.import_date as date,
                        si.code as referenceCode
                    FROM stock_in_details sid
                    JOIN stock_ins si ON sid.stock_in_id = si.id
                    JOIN items i ON sid.item_id = i.id
                    WHERE si.status = 'completed'

                    UNION ALL

                    -- Sale movements
                    SELECT
                        sd.item_id,
                        i.name as itemName,
                        i.code as itemCode,
                        'OUT' as movementType,
                        'Sale' as description,
                        -sd.quantity as quantity,
                        sd.unit_price as unitPrice,
                        sd.subtotal as totalAmount,
                        s.sale_date as date,
                        s.code as referenceCode
                    FROM sale_details sd
                    JOIN sales s ON sd.sale_id = s.id
                    JOIN items i ON sd.item_id = i.id
                    WHERE s.status = 'completed'
                ) movements
                ${dateFilter}
                ORDER BY date DESC, itemName ASC
                LIMIT ${parseInt(limit)}
            `);

            res.json({
                success: true,
                data: results
            });

        } catch (error) {
            console.error('Get stock movement report error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};

module.exports = reportController;