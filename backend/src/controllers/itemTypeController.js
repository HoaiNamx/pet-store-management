const { ItemType } = require('../models');
const Joi = require('joi');
const { Op } = require('sequelize');

// AFTER - createSchema có isActive
const createSchema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().optional(),
    isActive: Joi.boolean().optional().default(true)  // ✅ ADDED
});

const updateSchema = Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().optional(),
    isActive: Joi.boolean().optional()
});

const itemTypeController = {
    // Get all item types
    getAll: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
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

            // Active filter
            if (isActive !== 'all') {
                whereClause.isActive = isActive === 'true';
            }

            const { count, rows } = await ItemType.findAndCountAll({
                where: whereClause,
                order: [[sortBy, sortOrder]],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                success: true,
                data: {
                    itemTypes: rows,
                    pagination: {
                        current: parseInt(page),
                        limit: parseInt(limit),
                        total: count,
                        pages: Math.ceil(count / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get item types error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Get single item type
    getById: async (req, res) => {
        try {
            const { id } = req.params;

            const itemType = await ItemType.findByPk(id);

            if (!itemType) {
                return res.status(404).json({
                    success: false,
                    message: 'Item type not found'
                });
            }

            res.json({
                success: true,
                data: itemType
            });

        } catch (error) {
            console.error('Get item type error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Create item type
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

            const { name, description, isActive = true } = req.body;

            // Check if name already exists
            const existingItemType = await ItemType.findOne({
                where: { name }
            });

            if (existingItemType) {
                return res.status(409).json({
                    success: false,
                    message: 'Item type name already exists'
                });
            }

            // Create item type
            const itemType = await ItemType.create({
                name,
                description,
                isActive
            });

            res.status(201).json({
                success: true,
                message: 'Item type created successfully',
                data: itemType
            });

        } catch (error) {
            console.error('Create item type error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Update item type
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

            const itemType = await ItemType.findByPk(id);
            if (!itemType) {
                return res.status(404).json({
                    success: false,
                    message: 'Item type not found'
                });
            }

            // Check if new name already exists (if name is being updated)
            if (req.body.name && req.body.name !== itemType.name) {
                const existingItemType = await ItemType.findOne({
                    where: {
                        name: req.body.name,
                        id: { [Op.ne]: id }
                    }
                });

                if (existingItemType) {
                    return res.status(409).json({
                        success: false,
                        message: 'Item type name already exists'
                    });
                }
            }

            // Update item type
            await itemType.update(req.body);

            res.json({
                success: true,
                message: 'Item type updated successfully',
                data: itemType
            });

        } catch (error) {
            console.error('Update item type error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Delete item type (soft delete)
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            const itemType = await ItemType.findByPk(id);
            if (!itemType) {
                return res.status(404).json({
                    success: false,
                    message: 'Item type not found'
                });
            }

            // Check if item type is being used by items
            const { Item } = require('../models');
            const itemsCount = await Item.count({
                where: { itemTypeId: id }
            });

            if (itemsCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete item type. It is being used by ${itemsCount} item(s)`
                });
            }

            // Soft delete
            await itemType.destroy();

            res.json({
                success: true,
                message: 'Item type deleted successfully'
            });

        } catch (error) {
            console.error('Delete item type error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Get active item types (for dropdowns)
    getActive: async (req, res) => {
        try {
            const itemTypes = await ItemType.findAll({
                where: { isActive: true },
                order: [['name', 'ASC']],
                attributes: ['id', 'name']
            });

            res.json({
                success: true,
                data: itemTypes
            });

        } catch (error) {
            console.error('Get active item types error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};

module.exports = itemTypeController;