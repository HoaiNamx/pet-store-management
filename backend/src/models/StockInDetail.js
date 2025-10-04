const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockInDetail = sequelize.define('StockInDetail', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    stockInId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'stock_in_id',
        references: {
            model: 'stock_ins',
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
    costPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'cost_price',
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    expiryDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'expiry_date'
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
    tableName: 'stock_in_details',
    timestamps: true,
    paranoid: true,
    hooks: {
        beforeSave: (detail) => {
            // Auto calculate subtotal
            detail.subtotal = detail.quantity * detail.costPrice;
        }
    }
});

// Instance methods
StockInDetail.prototype.isExpired = function () {
    if (!this.expiryDate) return false;
    return new Date(this.expiryDate) < new Date();
};

StockInDetail.prototype.isExpiringSoon = function (days = 30) {
    if (!this.expiryDate) return false;
    const expiryDate = new Date(this.expiryDate);
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + days);
    return expiryDate <= warningDate;
};

StockInDetail.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.deletedAt;
    return {
        ...values,
        isExpired: this.isExpired(),
        isExpiringSoon: this.isExpiringSoon()
    };
};

module.exports = StockInDetail;