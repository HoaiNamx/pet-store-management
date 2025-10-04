require('dotenv').config();
const sequelize = require('./database');
const { User, ItemType } = require('../models');

const seedData = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // Sync database first
        await sequelize.sync({ force: false });

        // Create admin user if not exists
        const [adminUser, createdUser] = await User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                username: 'admin',
                password: 'dodo2811',
                fullName: 'System Administrator',
                role: 'admin',
                isActive: true
            }
        });

        if (createdUser) {
            console.log('✅ Admin user created successfully');
            console.log('   Username: admin');
            console.log('   Password: dodo2811');
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        // Create default item types if not exists
        const defaultItemTypes = [
            {
                name: 'Đồ ăn cho chó',
                description: 'Thức ăn khô, thức ăn ướt, snack cho chó'
            },
            {
                name: 'Đồ ăn cho mèo',
                description: 'Thức ăn khô, thức ăn ướt, snack cho mèo'
            },
            {
                name: 'Quần áo cho chó',
                description: 'Áo, váy, phụ kiện thời trang cho chó'
            },
            {
                name: 'Quần áo cho mèo',
                description: 'Áo, váy, phụ kiện thời trang cho mèo'
            },
            {
                name: 'Đồ chơi',
                description: 'Đồ chơi cho thú cưng'
            },
            {
                name: 'Phụ kiện',
                description: 'Dây dắt, bát ăn, lồng, vòng cổ và các phụ kiện khác'
            }
        ];

        for (const itemTypeData of defaultItemTypes) {
            const [itemType, createdItemType] = await ItemType.findOrCreate({
                where: { name: itemTypeData.name },
                defaults: itemTypeData
            });

            if (createdItemType) {
                console.log(`✅ Item type created: ${itemType.name}`);
            }
        }

        console.log('🎉 Database seeding completed successfully!');
        console.log('');
        console.log('=== LOGIN CREDENTIALS ===');
        console.log('Username: admin');
        console.log('Password: dodo2811');
        console.log('=========================');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
};

// Run seeding if this file is executed directly
if (require.main === module) {
    seedData()
        .then(() => {
            console.log('Seeding completed. Exiting...');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Seeding failed:', error);
            process.exit(1);
        });
}

module.exports = seedData;