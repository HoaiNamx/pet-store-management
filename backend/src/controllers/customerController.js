const { Customer, Sale, SaleDetail, Item } = require('../models');
const Joi = require('joi');
const { Op } = require('sequelize');

// Validation schemas - SIMPLIFIED
const createSchema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    phone: Joi.string().max(20).optional().allow(''),
    address: Joi.string().optional().allow(''),
    email: Joi.string().max(100).optional().allow(''),
    birthday: Joi.string().optional().allow(''), // Simple string, no date validation
    notes: Joi.string().optional().allow(''),
    isActive: Joi.boolean().optional().default(true)  // ADDED
});

const updateSchema = Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    phone: Joi.string().max(20).optional().allow(''),
    address: Joi.string().optional().allow(''),
    email: Joi.string().max(100).optional().allow(''),
    birthday: Joi.string().optional().allow(''),
    notes: Joi.string().optional().allow(''),
    isActive: Joi.boolean().optional()
});

const customerController = {
    // Get all customers
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
                    { phone: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } }
                ];
            }

            // Active filter
            if (isActive !== 'all') {
                whereClause.isActive = isActive === 'true';
            }

            const { count, rows } = await Customer.findAndCountAll({
                where: whereClause,
                order: [[sortBy, sortOrder]],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                success: true,
                data: {
                    customers: rows,
                    pagination: {
                        current: parseInt(page),
                        limit: parseInt(limit),
                        total: count,
                        pages: Math.ceil(count / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get customers error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Get single customer
    getById: async (req, res) => {
        try {
            const { id } = req.params;

            const customer = await Customer.findByPk(id, {
                include: [{
                    model: Sale,
                    as: 'sales',
                    limit: 10,
                    order: [['saleDate', 'DESC']],
                    include: [{
                        model: SaleDetail,
                        as: 'details',
                        include: [{
                            model: Item,
                            as: 'item',
                            attributes: ['id', 'name', 'unit']
                        }]
                    }]
                }]
            });

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            res.json({
                success: true,
                data: customer
            });

        } catch (error) {
            console.error('Get customer error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Create customer
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

            const { name, phone, address, email, birthday, notes, isActive = true } = req.body;

            // Check if phone already exists (if provided and not empty)
            if (phone && phone.trim()) {
                const existingCustomer = await Customer.findOne({
                    where: { phone: phone.trim() }
                });

                if (existingCustomer) {
                    return res.status(409).json({
                        success: false,
                        message: 'Phone number already exists'
                    });
                }
            }

            // Create customer
            const customer = await Customer.create({
                name: name.trim(),
                phone: phone?.trim() || null,
                address: address?.trim() || null,
                email: email?.trim() || null,
                birthday: birthday?.trim() || null,
                notes: notes?.trim() || null,
                isActive,
                code: `CUS${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`
            });

            res.status(201).json({
                success: true,
                message: 'Customer created successfully',
                data: customer
            });

        } catch (error) {
            console.error('Create customer error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Update customer
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

            const customer = await Customer.findByPk(id);
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            // Check if new phone already exists (if phone is being updated and not empty)
            if (req.body.phone && req.body.phone.trim() && req.body.phone.trim() !== customer.phone) {
                const existingCustomer = await Customer.findOne({
                    where: {
                        phone: req.body.phone.trim(),
                        id: { [Op.ne]: id }
                    }
                });

                if (existingCustomer) {
                    return res.status(409).json({
                        success: false,
                        message: 'Phone number already exists'
                    });
                }
            }

            // Prepare update data with trimming
            const updateData = {};
            Object.keys(req.body).forEach(key => {
                if (typeof req.body[key] === 'string') {
                    updateData[key] = req.body[key].trim() || null;
                } else {
                    updateData[key] = req.body[key];
                }
            });

            // Update customer
            await customer.update(updateData);

            res.json({
                success: true,
                message: 'Customer updated successfully',
                data: customer
            });

        } catch (error) {
            console.error('Update customer error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Delete customer (soft delete)
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            const customer = await Customer.findByPk(id);
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            // Check if customer has sales
            const salesCount = await Sale.count({
                where: { customerId: id }
            });

            if (salesCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete customer. Customer has ${salesCount} sale(s) associated`
                });
            }

            // Soft delete
            await customer.destroy();

            res.json({
                success: true,
                message: 'Customer deleted successfully'
            });

        } catch (error) {
            console.error('Delete customer error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Get customer analytics
    getAnalytics: async (req, res) => {
        try {
            const { id } = req.params;
            const { days = 90 } = req.query;

            const customer = await Customer.findByPk(id);
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(days));

            // Get purchase history and trends
            const sales = await Sale.findAll({
                where: {
                    customerId: id,
                    saleDate: { [Op.gte]: startDate }
                },
                include: [{
                    model: SaleDetail,
                    as: 'details',
                    include: [{
                        model: Item,
                        as: 'item',
                        include: ['itemType']
                    }]
                }],
                order: [['saleDate', 'ASC']]
            });

            // Calculate analytics
            const totalSpent = sales.reduce((sum, sale) => sum + parseFloat(sale.finalAmount), 0);
            const totalTransactions = sales.length;
            const avgTransactionValue = totalTransactions > 0 ? totalSpent / totalTransactions : 0;

            // Most purchased items
            const itemPurchases = {};
            sales.forEach(sale => {
                sale.details.forEach(detail => {
                    const itemName = detail.item.name;
                    if (!itemPurchases[itemName]) {
                        itemPurchases[itemName] = { quantity: 0, amount: 0 };
                    }
                    itemPurchases[itemName].quantity += detail.quantity;
                    itemPurchases[itemName].amount += parseFloat(detail.subtotal);
                });
            });

            const topItems = Object.entries(itemPurchases)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);

            // Purchase frequency by day of week
            const dayFrequency = Array(7).fill(0);
            sales.forEach(sale => {
                const dayOfWeek = new Date(sale.saleDate).getDay();
                dayFrequency[dayOfWeek]++;
            });

            res.json({
                success: true,
                data: {
                    customer,
                    analytics: {
                        totalSpent,
                        totalTransactions,
                        avgTransactionValue,
                        topItems,
                        dayFrequency,
                        lastPurchase: sales.length > 0 ? sales[sales.length - 1].saleDate : null
                    }
                }
            });

        } catch (error) {
            console.error('Get customer analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Search customers for dropdown/autocomplete
    search: async (req, res) => {
        try {
            const { q = '', limit = 10 } = req.query;

            const customers = await Customer.findAll({
                where: {
                    [Op.and]: [
                        { isActive: true },
                        {
                            [Op.or]: [
                                { name: { [Op.like]: `%${q}%` } },
                                { phone: { [Op.like]: `%${q}%` } }
                            ]
                        }
                    ]
                },
                attributes: ['id', 'name', 'phone'],
                limit: parseInt(limit),
                order: [['name', 'ASC']]
            });

            res.json({
                success: true,
                data: customers
            });

        } catch (error) {
            console.error('Search customers error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};

module.exports = customerController;