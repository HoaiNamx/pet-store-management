const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
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
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 100]
        }
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
            is: /^[\d\s\-\+\(\)]+$/ // Phone number format
        }
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    birthday: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'customers',
    timestamps: true,
    paranoid: true,
    hooks: {
        beforeCreate: async (customer) => {
            if (!customer.code) {
                // Auto generate code: CUS + timestamp + random
                const timestamp = Date.now().toString().slice(-6);
                const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
                customer.code = `CUS${timestamp}${random}`;
            }
        }
    }
});

// Instance methods
Customer.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.deletedAt;
    return values;
};

module.exports = Customer;