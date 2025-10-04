const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Item = sequelize.define('Item', {
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
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 200]
        }
    },
    itemTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'item_type_id',
        references: {
            model: 'item_types',
            key: 'id'
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    sellingPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'selling_price',
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pcs'
    },
    imagePath: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'image_path'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'items',
    timestamps: true,
    paranoid: true,
    hooks: {
        beforeCreate: async (item) => {
            if (!item.code) {
                // Auto generate code: IT + timestamp + random
                const timestamp = Date.now().toString().slice(-6);
                const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
                item.code = `IT${timestamp}${random}`;
            }
        }
    }
});

// Instance methods
Item.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.deletedAt;
    return values;
};

module.exports = Item;