const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const Brand = require('./Brand');
const Shop = require('./Shop');
const Category = require('./Category');

class Product extends Model {}

Product.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  product_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Product name is required' }
    }
  },
  
  length: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Length is required' },
      min: { args: [0], msg: 'Length must be positive' }
    }
  },
  
  width: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Width is required' },
      min: { args: [0], msg: 'Width must be positive' }
    }
  },
  
  thickness: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: { args: [0], msg: 'Thickness must be positive' }
    }
  },
  
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Quantity is required' },
      min: { args: [0], msg: 'Quantity must be non-negative' }
    }
  },
  
  weight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: { args: [0], msg: 'Weight must be positive' }
    }
  },
  
  brand_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'brands',
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
  
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Product',
  tableName: 'products',
  
  indexes: [
    {
      fields: ['brand_id']
    },
    {
      fields: ['shop_id']
    },
    {
      fields: ['category_id']
    }
  ]
});

// Define associations
Product.belongsTo(Brand, {
  foreignKey: 'brand_id',
  as: 'brand'
});

Product.belongsTo(Shop, {
  foreignKey: 'shop_id',
  as: 'shop'
});

Product.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
});

module.exports = Product;
