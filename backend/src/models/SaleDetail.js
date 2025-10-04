const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SaleDetail = sequelize.define('SaleDetail', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    saleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'sale_id',
        references: {
            model: 'sales',
            key: 'id'
        }
    },
    itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'item_id',
        references: {
            model: 'items',
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'unit_price',
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    costPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true, // For profit calculation
        field: 'cost_price',
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: 0
        }
    }
}, {
    tableName: 'sale_details',
    timestamps: true,
    paranoid: true,
    hooks: {
        beforeSave: (detail) => {
            // Auto calculate subtotal
            detail.subtotal = detail.quantity * detail.unitPrice;
        }
    }
});

// Instance methods
SaleDetail.prototype.calculateProfit = function () {
    if (!this.costPrice) return 0;
    return (this.unitPrice - this.costPrice) * this.quantity;
};

SaleDetail.prototype.getProfitMargin = function () {
    if (!this.costPrice || this.costPrice === 0) return 0;
    return ((this.unitPrice - this.costPrice) / this.unitPrice * 100).toFixed(2);
};

SaleDetail.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.deletedAt;
    return {
        ...values,
        profit: this.calculateProfit(),
        profitMargin: this.getProfitMargin()
    };
};

module.exports = SaleDetail;