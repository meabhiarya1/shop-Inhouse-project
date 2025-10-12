const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const Product = require('./Product');
const Shop = require('./Shop');

class Sale extends Model {}

Sale.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  
  shop_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'shops',
      key: 'id'
    }
  },

  customer_sale_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'customer_sale_mappings',
      key: 'id'
    }
  },
  
  quantity_sold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'Quantity sold must be at least 1' }
    }
  },
  
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: { args: [0], msg: 'Unit price must be non-negative' }
    }
  },

}, {
  sequelize,
  modelName: 'Sale',
  tableName: 'sales',
  
  indexes: [
    {
      fields: ['product_id']
    },
    {
      fields: ['shop_id']
    },
    {
      fields: ['customer_sale_id']
    }
  ]
});

// Import CustomerSaleMapping for associations
const CustomerSaleMapping = require('./CustomerSaleMapping');

// Define associations
Sale.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

Sale.belongsTo(Shop, {
  foreignKey: 'shop_id',
  as: 'shop'
});

Sale.belongsTo(CustomerSaleMapping, {
  foreignKey: 'customer_sale_id',
  as: 'customerSale'
});

// Reverse associations
Product.hasMany(Sale, {
  foreignKey: 'product_id',
  as: 'sales'
});

Shop.hasMany(Sale, {
  foreignKey: 'shop_id',
  as: 'sales'
});

CustomerSaleMapping.hasMany(Sale, {
  foreignKey: 'customer_sale_id',
  as: 'sales'
});

module.exports = Sale;
