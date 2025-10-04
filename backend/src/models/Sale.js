const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sale = sequelize.define('Sale', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Null for walk-in customers
        field: 'customer_id',
        references: {
            model: 'customers',
            key: 'id'
        }
    },
    saleDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'sale_date',
        defaultValue: DataTypes.NOW
    },
    totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'total_amount',
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    finalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'final_amount',
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    paymentMethod: {
        type: DataTypes.ENUM('cash', 'card', 'transfer', 'other'),
        defaultValue: 'cash',
        field: 'payment_method'
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'refunded'),
        defaultValue: 'completed'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'sales',
    timestamps: true,
    paranoid: true,
    hooks: {
        beforeCreate: async (sale) => {
            if (!sale.code) {
                // Auto generate code: SA + YYYYMMDD + sequential number
                const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                const count = await Sale.count({
                    where: sequelize.where(
                        sequelize.fn('DATE', sequelize.col('sale_date')),
                        date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8)
                    )
                });
                const sequential = (count + 1).toString().padStart(4, '0');
                sale.code = `SA${date}${sequential}`;
            }

            // Auto calculate final amount
            sale.finalAmount = sale.totalAmount - sale.discount;
        },
        beforeUpdate: (sale) => {
            // Recalculate final amount on update
            if (sale.changed('totalAmount') || sale.changed('discount')) {
                sale.finalAmount = sale.totalAmount - sale.discount;
            }
        }
    }
});

// Instance methods
Sale.prototype.calculateProfit = function (saleDetails) {
    // This will be used with associated sale details
    let totalCost = 0;
    if (saleDetails && saleDetails.length > 0) {
        totalCost = saleDetails.reduce((sum, detail) => {
            return sum + (detail.costPrice * detail.quantity);
        }, 0);
    }
    return this.finalAmount - totalCost;
};

Sale.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.deletedAt;
    return values;
};

module.exports = Sale;