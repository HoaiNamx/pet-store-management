const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemType = sequelize.define('ItemType', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [1, 100]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'item_types',
    timestamps: true,
    paranoid: true
});

// Instance methods
ItemType.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.deletedAt;
    return values;
};

module.exports = ItemType;