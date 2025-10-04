const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inventory = sequelize.define('Inventory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // One inventory record per item
        field: 'item_id',
        references: {
            model: 'items',
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    minStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'min_stock',
        validate: {
            min: 0
        }
    },
    avgCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'avg_cost',
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    location: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    lastUpdated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'last_updated'
    }
}, {
    tableName: 'inventory',
    timestamps: true,
    paranoid: true,
    hooks: {
        beforeUpdate: (inventory) => {
            inventory.lastUpdated = new Date();
        }
    }
});

// Instance methods
Inventory.prototype.isLowStock = function () {
    return this.quantity <= this.minStock;
};

Inventory.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.deletedAt;
    return {
        ...values,
        isLowStock: this.isLowStock()
    };
};

module.exports = Inventory;