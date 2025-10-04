const { Item, ItemType, Inventory } = require('../models');
const Joi = require('joi');
const { Op } = require('sequelize');

// Validation schemas - FIXED
const createSchema = Joi.object({
    name: Joi.string().min(1).max(200).required(),
    itemTypeId: Joi.number().integer().required(),
    description: Joi.string().optional(),
    sellingPrice: Joi.number().positive().required(),
    unit: Joi.string().max(20).default('pcs'),
    imagePath: Joi.string().optional(),
    isActive: Joi.boolean().optional().default(true)  // ← ADDED
});

const updateSchema = Joi.object({
    name: Joi.string().min(1).max(200).optional(),
    itemTypeId: Joi.number().integer().optional(),
    description: Joi.string().optional(),
    sellingPrice: Joi.number().positive().optional(),
    unit: Joi.string().max(20).optional(),
    imagePath: Joi.string().optional(),
    isActive: Joi.boolean().optional()
});

const itemController = {
    // Get all items
    getAll: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                itemTypeId = '',
                isActive = 'all',
                sortBy = 'createdAt',
                sortOrder = 'DESC'
            } = req.query;

            const offset = (page - 1) * limit;
            const whereClause = {};

            // Search filter
            if (search) {
                whereClause[Op.or] = [
                    { name: { [Op.like]: `%${search}%` } },
                    { description: { [Op.like]: `%${search}%` } }
                ];
            }

            // ItemType filter
            if (itemTypeId) {
                whereClause.itemTypeId = itemTypeId;
            }

            // Active filter
            if (isActive !== 'all') {
                whereClause.isActive = isActive === 'true';
            }

            const { count, rows } = await Item.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: ItemType,
                        as: 'itemType',
                        attributes: ['id', 'name']
                    },
                    {
                        model: Inventory,
                        as: 'inventory',
                        attributes: ['quantity', 'minStock', 'avgCost']
                    }
                ],
                order: [[sortBy, sortOrder]],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                success: true,
                data: {
                    items: rows,
                    pagination: {
                        current: parseInt(page),
                        limit: parseInt(limit),
                        total: count,
                        pages: Math.ceil(count / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get items error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Get single item
    getById: async (req, res) => {
        try {
            const { id } = req.params;

            const item = await Item.findByPk(id, {
                include: [
                    {
                        model: ItemType,
                        as: 'itemType'
                    },
                    {
                        model: Inventory,
                        as: 'inventory'
                    }
                ]
            });

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Item not found'
                });
            }

            res.json({
                success: true,
                data: item
            });

        } catch (error) {
            console.error('Get item error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Create item
    create: async (req, res) => {
        try {
            // Validate input
            const { error } = createSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const { name, itemTypeId, description, sellingPrice, unit, imagePath, isActive = true } = req.body;

            // Check if itemType exists
            const itemType = await ItemType.findByPk(itemTypeId);
            if (!itemType) {
                return res.status(400).json({
                    success: false,
                    message: 'Item type not found'
                });
            }

            // Check if name already exists
            const existingItem = await Item.findOne({
                where: { name }
            });

            if (existingItem) {
                return res.status(409).json({
                    success: false,
                    message: 'Item name already exists'
                });
            }

            // Create item
            const item = await Item.create({
                name,
                itemTypeId,
                description,
                sellingPrice,
                unit: unit || 'pcs',
                imagePath,
                isActive,
                code: `IT${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`
            });

            // Create corresponding inventory record
            await Inventory.create({
                itemId: item.id,
                quantity: 0,
                minStock: 0
            });

            // Fetch item with associations
            const createdItem = await Item.findByPk(item.id, {
                include: [
                    {
                        model: ItemType,
                        as: 'itemType'
                    },
                    {
                        model: Inventory,
                        as: 'inventory'
                    }
                ]
            });

            res.status(201).json({
                success: true,
                message: 'Item created successfully',
                data: createdItem
            });

        } catch (error) {
            console.error('Create item error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Update item
    update: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate input
            const { error } = updateSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const item = await Item.findByPk(id);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Item not found'
                });
            }

            // Check if itemType exists (if being updated)
            if (req.body.itemTypeId) {
                const itemType = await ItemType.findByPk(req.body.itemTypeId);
                if (!itemType) {
                    return res.status(400).json({
                        success: false,
                        message: 'Item type not found'
                    });
                }
            }

            // Check if new name already exists (if name is being updated)
            if (req.body.name && req.body.name !== item.name) {
                const existingItem = await Item.findOne({
                    where: {
                        name: req.body.name,
                        id: { [Op.ne]: id }
                    }
                });

                if (existingItem) {
                    return res.status(409).json({
                        success: false,
                        message: 'Item name already exists'
                    });
                }
            }

            // Update item
            await item.update(req.body);

            // Fetch updated item with associations
            const updatedItem = await Item.findByPk(item.id, {
                include: [
                    {
                        model: ItemType,
                        as: 'itemType'
                    },
                    {
                        model: Inventory,
                        as: 'inventory'
                    }
                ]
            });

            res.json({
                success: true,
                message: 'Item updated successfully',
                data: updatedItem
            });

        } catch (error) {
            console.error('Update item error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Delete item (soft delete)
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            const item = await Item.findByPk(id);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Item not found'
                });
            }

            // Check if item is being used in sales
            const { SaleDetail } = require('../models');
            const salesCount = await SaleDetail.count({
                where: { itemId: id }
            });

            if (salesCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete item. It has been used in ${salesCount} sale(s)`
                });
            }

            // Soft delete item and its inventory
            await item.destroy();
            await Inventory.destroy({
                where: { itemId: id }
            });

            res.json({
                success: true,
                message: 'Item deleted successfully'
            });

        } catch (error) {
            console.error('Delete item error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Search items for dropdown/autocomplete
    search: async (req, res) => {
        try {
            const { q = '', limit = 10, inStock = false } = req.query;

            const whereClause = {
                isActive: true,
                [Op.or]: [
                    { name: { [Op.like]: `%${q}%` } },
                    { code: { [Op.like]: `%${q}%` } }
                ]
            };

            const includeOptions = [
                {
                    model: ItemType,
                    as: 'itemType',
                    attributes: ['name']
                }
            ];

            // If inStock filter is enabled, include inventory and filter
            if (inStock === 'true') {
                includeOptions.push({
                    model: Inventory,
                    as: 'inventory',
                    where: {
                        quantity: { [Op.gt]: 0 }
                    },
                    attributes: ['quantity']
                });
            }

            const items = await Item.findAll({
                where: whereClause,
                include: includeOptions,
                attributes: ['id', 'name', 'code', 'sellingPrice', 'unit'],
                limit: parseInt(limit),
                order: [['name', 'ASC']]
            });

            res.json({
                success: true,
                data: items
            });

        } catch (error) {
            console.error('Search items error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Get low stock items
    getLowStock: async (req, res) => {
        try {
            const items = await Item.findAll({
                include: [{
                    model: Inventory,
                    as: 'inventory',
                    where: {
                        [Op.or]: [
                            { quantity: { [Op.lte]: { [Op.col]: 'inventory.min_stock' } } },
                            { quantity: 0 }
                        ]
                    }
                }, {
                    model: ItemType,
                    as: 'itemType',
                    attributes: ['name']
                }],
                where: { isActive: true },
                order: [['inventory', 'quantity', 'ASC']]
            });

            res.json({
                success: true,
                data: items
            });

        } catch (error) {
            console.error('Get low stock items error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};

module.exports = itemController;