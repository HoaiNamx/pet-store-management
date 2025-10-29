const { Sale, SaleDetail, Customer, Item, ItemType, Inventory } = require('../models');
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Validation schemas
const createSaleSchema = Joi.object({
    customerId: Joi.number().integer().optional(),
    saleDate: Joi.date().default(() => new Date()),
    details: Joi.array().items(
        Joi.object({
            itemId: Joi.number().integer().required(),
            quantity: Joi.number().integer().min(1).required(),
            unitPrice: Joi.number().positive().required()
        })
    ).min(1).required(),
    discount: Joi.number().min(0).default(0),
    paymentMethod: Joi.string().valid('cash', 'card', 'transfer', 'other').default('cash'),
    notes: Joi.string().optional()
});

const salesController = {
    // Get all sales
    getAll: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                customerId = '',
                fromDate = '',
                toDate = '',
                paymentMethod = '',
                sortBy = 'saleDate',
                sortOrder = 'DESC'
            } = req.query;

            const offset = (page - 1) * limit;
            const whereClause = {};

            // Customer filter
            if (customerId) {
                whereClause.customerId = customerId;
            }

            // Date range filter
            if (fromDate || toDate) {
                whereClause.saleDate = {};
                if (fromDate) {
                    // Include full day from 00:00:00
                    whereClause.saleDate[Op.gte] = fromDate + ' 00:00:00';
                }
                if (toDate) {
                    // Include full day until 23:59:59
                    whereClause.saleDate[Op.lte] = toDate + ' 23:59:59';
                }
            }

            // Payment method filter
            if (paymentMethod) {
                whereClause.paymentMethod = paymentMethod;
            }

            // Include options
            const include = [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'phone'],
                    where: search ? {
                        [Op.or]: [
                            { name: { [Op.like]: `%${search}%` } },
                            { phone: { [Op.like]: `%${search}%` } }
                        ]
                    } : undefined,
                    required: search ? true : false
                },
                {
                    model: SaleDetail,
                    as: 'details',
                    include: [{
                        model: Item,
                        as: 'item',
                        attributes: ['id', 'name', 'unit']
                    }]
                }
            ];

            const { count, rows } = await Sale.findAndCountAll({
                where: whereClause,
                include,
                order: [[sortBy, sortOrder]],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                success: true,
                data: {
                    sales: rows,
                    pagination: {
                        current: parseInt(page),
                        limit: parseInt(limit),
                        total: count,
                        pages: Math.ceil(count / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get sales error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Get single sale
    getById: async (req, res) => {
        try {
            const { id } = req.params;

            const sale = await Sale.findByPk(id, {
                include: [
                    {
                        model: Customer,
                        as: 'customer'
                    },
                    {
                        model: SaleDetail,
                        as: 'details',
                        include: [{
                            model: Item,
                            as: 'item',
                            include: [{
                                model: ItemType,
                                as: 'itemType',
                                attributes: ['name']
                            }]
                        }]
                    }
                ]
            });

            if (!sale) {
                return res.status(404).json({
                    success: false,
                    message: 'Sale not found'
                });
            }

            res.json({
                success: true,
                data: sale
            });

        } catch (error) {
            console.error('Get sale error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Create sale
    create: async (req, res) => {
        const transaction = await sequelize.transaction();

        try {
            // Validate input
            const { error, value } = createSaleSchema.validate(req.body);
            if (error) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const { customerId, saleDate, details, discount, paymentMethod, notes } = value;

            // Check customer exists (if provided)
            if (customerId) {
                const customer = await Customer.findByPk(customerId);
                if (!customer) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: 'Customer not found'
                    });
                }
            }

            // Validate items and check inventory
            let totalAmount = 0;
            for (const detail of details) {
                const { itemId, quantity, unitPrice } = detail;

                // Check if item exists
                const item = await Item.findByPk(itemId);
                if (!item) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Item with ID ${itemId} not found`
                    });
                }

                // Check inventory
                const inventory = await Inventory.findOne({
                    where: { itemId }
                });

                if (!inventory || inventory.quantity < quantity) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for item "${item.name}". Available: ${inventory ? inventory.quantity : 0}, Required: ${quantity}`
                    });
                }

                totalAmount += quantity * unitPrice;
            }

            const finalAmount = Math.max(0, totalAmount - discount);

            // Create sale
            // Create sale (remove finalAmount, let model calculate it)
            const sale = await Sale.create({
                customerId: customerId || null,
                saleDate,
                totalAmount,
                discount: discount || 0,
                finalAmount,
                paymentMethod,
                notes,
                code: `SA${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
            }, { transaction });

            // Create sale details and update inventory
            for (const detail of details) {
                const { itemId, quantity, unitPrice } = detail;

                // Get item's cost price for profit calculation
                const inventory = await Inventory.findOne({
                    where: { itemId }
                });

                // Create sale detail
                await SaleDetail.create({
                    saleId: sale.id,
                    itemId,
                    quantity,
                    unitPrice,
                    costPrice: inventory ? inventory.avgCost : 0,
                    subtotal: quantity * unitPrice
                }, { transaction });

                // Update inventory
                await inventory.update({
                    quantity: inventory.quantity - quantity,
                    lastUpdated: new Date()
                }, { transaction });
            }

            await transaction.commit();

            // Fetch created sale with details
            const createdSale = await Sale.findByPk(sale.id, {
                include: [
                    {
                        model: Customer,
                        as: 'customer'
                    },
                    {
                        model: SaleDetail,
                        as: 'details',
                        include: [{
                            model: Item,
                            as: 'item',
                            attributes: ['id', 'name', 'unit']
                        }]
                    }
                ]
            });

            res.status(201).json({
                success: true,
                message: 'Sale created successfully',
                data: createdSale
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Create sale error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Cancel sale (refund)
    cancel: async (req, res) => {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const { reason } = req.body;

            const sale = await Sale.findByPk(id, {
                include: [{
                    model: SaleDetail,
                    as: 'details'
                }]
            });

            if (!sale) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Sale not found'
                });
            }

            if (sale.status === 'cancelled' || sale.status === 'refunded') {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Sale is already cancelled or refunded'
                });
            }

            // Restore inventory
            for (const detail of sale.details) {
                const inventory = await Inventory.findOne({
                    where: { itemId: detail.itemId }
                });

                if (inventory) {
                    await inventory.update({
                        quantity: inventory.quantity + detail.quantity,
                        lastUpdated: new Date()
                    }, { transaction });
                }
            }

            // Update sale status
            await sale.update({
                status: 'refunded',
                notes: sale.notes ? `${sale.notes}\n[REFUNDED] ${reason}` : `[REFUNDED] ${reason}`
            }, { transaction });

            await transaction.commit();

            res.json({
                success: true,
                message: 'Sale cancelled and inventory restored',
                data: sale
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Cancel sale error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Get sales summary
    getSummary: async (req, res) => {
        try {
            const { fromDate, toDate } = req.query;
            const whereClause = { status: 'completed' };

            if (fromDate || toDate) {
                whereClause.saleDate = {};
                if (fromDate) whereClause.saleDate[Op.gte] = fromDate + ' 00:00:00';
                if (toDate) whereClause.saleDate[Op.lte] = toDate + ' 23:59:59';
            }

            // Get summary statistics
            const [salesData] = await sequelize.query(`
        SELECT 
          COUNT(*) as totalSales,
          SUM(final_amount) as totalRevenue,
          AVG(final_amount) as avgSaleValue,
          SUM(discount) as totalDiscount
        FROM sales 
        WHERE status = 'completed' 
        ${fromDate ? `AND sale_date >= '${fromDate}'` : ''}
        ${toDate ? `AND sale_date <= '${toDate}'` : ''}
      `);

            // Get top selling items
            const [topItems] = await sequelize.query(`
        SELECT 
          i.name as itemName,
          SUM(sd.quantity) as totalSold,
          SUM(sd.subtotal) as totalRevenue
        FROM sale_details sd
        JOIN items i ON sd.item_id = i.id
        JOIN sales s ON sd.sale_id = s.id
        WHERE s.status = 'completed'
        ${fromDate ? `AND s.sale_date >= '${fromDate}'` : ''}
        ${toDate ? `AND s.sale_date <= '${toDate}'` : ''}
        GROUP BY i.id, i.name
        ORDER BY totalSold DESC
        LIMIT 10
      `);

            // Get sales by payment method
            const [paymentMethods] = await sequelize.query(`
        SELECT 
          payment_method,
          COUNT(*) as count,
          SUM(final_amount) as total
        FROM sales 
        WHERE status = 'completed'
        ${fromDate ? `AND sale_date >= '${fromDate}'` : ''}
        ${toDate ? `AND sale_date <= '${toDate}'` : ''}
        GROUP BY payment_method
      `);

            res.json({
                success: true,
                data: {
                    summary: salesData[0],
                    topItems,
                    paymentMethods
                }
            });

        } catch (error) {
            console.error('Get sales summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};

module.exports = salesController;