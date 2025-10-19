const { Sequelize } = require('sequelize');

// Kiểm tra có DATABASE_URL không
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL is not defined in .env file!');
    process.exit(1);
}

// Tạo Sequelize instance cho PostgreSQL
const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
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
        paranoid: true,
        freezeTableName: true
    }
});

// Test connection
sequelize.authenticate()
    .then(() => {
        console.log('✅ PostgreSQL connection has been established successfully.');
    })
    .catch(err => {
        console.error('❌ Unable to connect to PostgreSQL database:', err);
    });

module.exports = sequelize;