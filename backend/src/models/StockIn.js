const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockIn = sequelize.define('StockIn', {
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
    importDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'import_date',
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
    status: {
        type: DataTypes.ENUM('draft', 'completed', 'cancelled'),
        defaultValue: 'draft'
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
    tableName: 'stock_ins',
    timestamps: true,
    paranoid: true,
    hooks: {
        beforeCreate: async (stockIn) => {
            if (!stockIn.code) {
                // Auto generate code: SI + YYYYMMDD + sequential number
                const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                const count = await StockIn.count({
                    where: {
                        importDate: stockIn.importDate
                    }
                });
                const sequential = (count + 1).toString().padStart(3, '0');
                stockIn.code = `SI${date}${sequential}`;
            }
        }
    }
});

// Instance methods
StockIn.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.deletedAt;
    return values;
};

module.exports = StockIn;