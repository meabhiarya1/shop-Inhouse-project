const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class CustomerSaleMapping extends Model {}

CustomerSaleMapping.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Total amount must be non-negative' }
    }
  },
  
  customer_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  customer_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  
  payment_method: {
    type: DataTypes.ENUM('cash', 'upi', 'cash/upi'),
    allowNull: true,
    defaultValue: 'cash'
  },
  
  sale_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  customer_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Customer paid amount must be non-negative' }
    }
  },
  
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null,
    validate: {
      min: { args: [0], msg: 'Discount amount must be non-negative' }
    }
  },
  
  rest_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null,
    validate: {
      min: { args: [0], msg: 'Rest amount must be non-negative' }
    }
  },

}, {
  sequelize,
  modelName: 'CustomerSaleMapping',
  tableName: 'customer_sale_mappings',
  
  indexes: [
    {
      fields: ['sale_date']
    },
    {
      fields: ['payment_method']
    }
  ]
});

module.exports = CustomerSaleMapping;
