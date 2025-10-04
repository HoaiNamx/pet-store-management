// Import all models
const User = require('./User');
const ItemType = require('./ItemType');
const Item = require('./Item');
const Customer = require('./Customer');
const Inventory = require('./Inventory');
const StockIn = require('./StockIn');
const StockInDetail = require('./StockInDetail');
const Sale = require('./Sale');
const SaleDetail = require('./SaleDetail');
// Define associations
const defineAssociations = () => {
    // ItemType -> Items (One to Many)
    ItemType.hasMany(Item, {
        foreignKey: 'itemTypeId',
        as: 'items'
    });
    Item.belongsTo(ItemType, {
        foreignKey: 'itemTypeId',
        as: 'itemType'
    });

    // Item -> Inventory (One to One)
    Item.hasOne(Inventory, {
        foreignKey: 'itemId',
        as: 'inventory'
    });
    Inventory.belongsTo(Item, {
        foreignKey: 'itemId',
        as: 'item'
    });

    // StockIn -> StockInDetails (One to Many)
    StockIn.hasMany(StockInDetail, {
        foreignKey: 'stockInId',
        as: 'details'
    });
    StockInDetail.belongsTo(StockIn, {
        foreignKey: 'stockInId',
        as: 'stockIn'
    });

    // Item -> StockInDetails (One to Many)
    Item.hasMany(StockInDetail, {
        foreignKey: 'itemId',
        as: 'stockInDetails'
    });
    StockInDetail.belongsTo(Item, {
        foreignKey: 'itemId',
        as: 'item'
    });

    // User -> StockIns (One to Many)
    User.hasMany(StockIn, {
        foreignKey: 'createdBy',
        as: 'stockIns'
    });
    StockIn.belongsTo(User, {
        foreignKey: 'createdBy',
        as: 'creator'
    });

    // Customer -> Sales (One to Many)
    Customer.hasMany(Sale, {
        foreignKey: 'customerId',
        as: 'sales'
    });
    Sale.belongsTo(Customer, {
        foreignKey: 'customerId',
        as: 'customer'
    });

    // User -> Sales (One to Many)
    User.hasMany(Sale, {
        foreignKey: 'createdBy',
        as: 'sales'
    });
    Sale.belongsTo(User, {
        foreignKey: 'createdBy',
        as: 'creator'
    });

    // Sale -> SaleDetails (One to Many)
    Sale.hasMany(SaleDetail, {
        foreignKey: 'saleId',
        as: 'details'
    });
    SaleDetail.belongsTo(Sale, {
        foreignKey: 'saleId',
        as: 'sale'
    });

    // Item -> SaleDetails (One to Many)
    Item.hasMany(SaleDetail, {
        foreignKey: 'itemId',
        as: 'saleDetails'
    });
    SaleDetail.belongsTo(Item, {
        foreignKey: 'itemId',
        as: 'item'
    });
};

// Call the function to define associations
defineAssociations();

// Export all models
module.exports = {
    User,
    ItemType,
    Item,
    Customer,
    Inventory,
    StockIn,
    StockInDetail,
    Sale,
    SaleDetail,
    defineAssociations
};