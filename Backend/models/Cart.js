const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Product = require('./Product');

class Cart extends Model {}

Cart.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    validate: {
      notEmpty: { msg: 'User ID is required' }
    }
  },
  
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    },
    validate: {
      notEmpty: { msg: 'Product ID is required' }
    }
  },
  
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      notEmpty: { msg: 'Quantity is required' },
      min: { 
        args: [1], 
        msg: 'Quantity must be at least 1' 
      }
    }
  }
}, {
  sequelize,
  modelName: 'Cart',
  tableName: 'cart_user_product_mapping',
  
  // Add composite unique constraint
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'product_id'],
      name: 'unique_user_product_cart'
    },
    {
      fields: ['user_id'],
      name: 'cart_user_id_index'
    }
  ]
});

// Define associations
Cart.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Cart.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// Add associations to User and Product models
User.hasMany(Cart, {
  foreignKey: 'user_id',
  as: 'cartItems'
});

Product.hasMany(Cart, {
  foreignKey: 'product_id',
  as: 'cartItems'
});

module.exports = Cart;
