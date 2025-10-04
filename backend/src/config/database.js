const { Sequelize } = require('sequelize');
const path = require('path');

const dbPath = path.join(__dirname, '../../database', process.env.DB_NAME || 'pet_store.sqlite');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: true,
        underscored: true,
        paranoid: true, // Soft delete
        freezeTableName: true
    }
});

module.exports = sequelize;