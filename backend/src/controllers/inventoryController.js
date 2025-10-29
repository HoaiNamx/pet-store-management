const { Inventory, Item, ItemType, StockIn, StockInDetail } = require('../models');
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Validation schemas
const stockInSchema = Joi.object({
    importDate: Joi.date().default(() => new Date()),
    details: Joi.array().items(
        Joi.object({
            itemId: Joi.number().integer().required(),
            quantity: Joi.number().integer().min(1).required(),
            costPrice: Joi.number().positive().required(),
            expiryDate: Joi.date().optional()
        })
    ).min(1).required(),
    notes: Joi.string().optional().allow('')
});

const adjustInventorySchema = Joi.object({
    itemId: Joi.number().integer().required(),
    newQuantity: Joi.number().integer().min(0).required(),
    reason: Joi.string().required()
});

const inventoryController = {
    // Get all inventory
    getAll: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                lowStock = false,
                sortBy = 'updatedAt',
                sortOrder = 'DESC'
            } = req.query;

            const offset = (page - 1) * limit;
            const whereClause = {};

            // Low stock filter
            if (lowStock === 'true') {
                whereClause[Op.or] = [
                    { quantity: { [Op.lte]: { [Op.col]: 'min_stock' } } },
                    { quantity: 0 }
                ];
            }

            // Include options
            const include = [{
                model: Item,
                as: 'item',
                include: [{
                    model: ItemType,
                    as: 'itemType',
                    attributes: ['name']
                }],
                where: search ? {
                    [Op.or]: [
                        { name: { [Op.like]: `%${search}%` } },
                        { code: { [Op.like]: `%${search}%` } }
                    ]
                } : undefined
            }];

            const { count, rows } = await Inventory.findAndCountAll({
                where: whereClause,
                include,
                order: [[sortBy, sortOrder]],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                success: true,
                data: {
                    inventory: rows,
                    pagination: {
                        current: parseInt(page),
                        limit: parseInt(limit),
                        total: count,
                        pages: Math.ceil(count / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get inventory error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Get inventory by item ID
    getByItemId: async (req, res) => {
        try {
            const { itemId } = req.params;

            const inventory = await Inventory.findOne({
                where: { itemId },
                include: [{
                    model: Item,
                    as: 'item',
                    include: [{
                        model: ItemType,
                        as: 'itemType'
                    }]
                }]
            });

            if (!inventory) {
                return res.status(404).json({
                    success: false,
                    message: 'Inventory not found'
                });
            }

            res.json({
                success: true,
                data: inventory
            });

        } catch (error) {
            console.error('Get inventory by item error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Stock In (Nhập hàng)
    stockIn: async (req, res) => {
        const transaction = await sequelize.transaction();

        try {
            // Validate input
            const { error } = stockInSchema.validate(req.body);
            if (error) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const { importDate, details, notes } = req.body;

            // Calculate total amount
            const totalAmount = details.reduce((sum, detail) => {
                return sum + (detail.quantity * detail.costPrice);
            }, 0);

            // Create StockIn record
            const stockIn = await StockIn.create({
                importDate,
                totalAmount,
                status: 'completed',
                notes,
                code: `SI${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`
            }, { transaction });

            // Process each detail
            for (const detail of details) {
                const { itemId, quantity, costPrice, expiryDate } = detail;

                // Check if item exists
                const item = await Item.findByPk(itemId);
                if (!item) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Item with ID ${itemId} not found`
                    });
                }

                // Create stock in detail
                await StockInDetail.create({
                    stockInId: stockIn.id,
                    itemId,
                    quantity,
                    costPrice,
                    expiryDate,
                    subtotal: quantity * costPrice
                }, { transaction });

                // Update inventory
                const [inventory] = await Inventory.findOrCreate({
                    where: { itemId },
                    defaults: {
                        itemId,
                        quantity: 0,
                        minStock: 0,
                        avgCost: costPrice
                    },
                    transaction
                });

                // Calculate new average cost
                const currentTotalValue = inventory.quantity * (inventory.avgCost || 0);
                const newTotalValue = currentTotalValue + (quantity * costPrice);
                const newTotalQuantity = inventory.quantity + quantity;
                const newAvgCost = newTotalQuantity > 0 ? newTotalValue / newTotalQuantity : 0;

                // Update inventory
                await inventory.update({
                    quantity: newTotalQuantity,
                    avgCost: newAvgCost,
                    lastUpdated: new Date()
                }, { transaction });
            }

            await transaction.commit();

            // Fetch created stock in with details
            const createdStockIn = await StockIn.findByPk(stockIn.id, {
                include: [{
                    model: StockInDetail,
                    as: 'details',
                    include: [{
                        model: Item,
                        as: 'item',
                        attributes: ['id', 'name', 'unit']
                    }]
                }]
            });

            res.status(201).json({
                success: true,
                message: 'Stock in completed successfully',
                data: createdStockIn
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Stock in error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Adjust inventory manually
    adjustInventory: async (req, res) => {
        try {
            // Validate input
            const { error } = adjustInventorySchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const { itemId, newQuantity, reason } = req.body;

            // Find inventory
            const inventory = await Inventory.findOne({
                where: { itemId },
                include: [{
                    model: Item,
                    as: 'item'
                }]
            });

            if (!inventory) {
                return res.status(404).json({
                    success: false,
                    message: 'Inventory not found'
                });
            }

            const oldQuantity = inventory.quantity;

            // Update inventory
            await inventory.update({
                quantity: newQuantity,
                lastUpdated: new Date()
            });

            res.json({
                success: true,
                message: 'Inventory adjusted successfully',
                data: {
                    item: inventory.item.name,
                    oldQuantity,
                    newQuantity,
                    difference: newQuantity - oldQuantity,
                    reason
                }
            });

        } catch (error) {
            console.error('Adjust inventory error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Update min stock level
    updateMinStock: async (req, res) => {
        try {
            const { itemId } = req.params;
            const { minStock } = req.body;

            if (typeof minStock !== 'number' || minStock < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Min stock must be a non-negative number'
                });
            }

            const inventory = await Inventory.findOne({
                where: { itemId }
            });

            if (!inventory) {
                return res.status(404).json({
                    success: false,
                    message: 'Inventory not found'
                });
            }

            await inventory.update({ minStock });

            res.json({
                success: true,
                message: 'Min stock updated successfully',
                data: inventory
            });

        } catch (error) {
            console.error('Update min stock error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Get low stock items
    getLowStock: async (req, res) => {
        try {
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
                data: lowStockItems
            });

        } catch (error) {
            console.error('Get low stock error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Get stock in history
    getStockInHistory: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                fromDate,
                toDate
            } = req.query;

            const offset = (page - 1) * limit;
            const whereClause = {};

            if (fromDate || toDate) {
                whereClause.importDate = {};
                if (fromDate) whereClause.importDate[Op.gte] = fromDate;
                if (toDate) whereClause.importDate[Op.lte] = toDate;
            }

            const { count, rows } = await StockIn.findAndCountAll({
                where: whereClause,
                include: [{
                    model: StockInDetail,
                    as: 'details',
                    include: [{
                        model: Item,
                        as: 'item',
                        attributes: ['id', 'name', 'unit']
                    }]
                }],
                order: [['importDate', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                success: true,
                data: {
                    stockIns: rows,
                    pagination: {
                        current: parseInt(page),
                        limit: parseInt(limit),
                        total: count,
                        pages: Math.ceil(count / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get stock in history error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};

module.exports = inventoryController;