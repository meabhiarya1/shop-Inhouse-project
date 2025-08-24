const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Shop extends Model {}

Shop.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Shop Basic Information
  shop_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Shop name is required' }
    }
  },
  
  shop_type: {
    type: DataTypes.ENUM('retail', 'wholesale', 'both'),
    allowNull: false,
    defaultValue: 'both'
  },
  
  // Contact Information
  phone_number: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      is: {
        args: /^[6-9]\d{9}$/,
        msg: 'Please enter a valid 10-digit phone number'
      }
    }
  },
  
  // Address Information
  street_address: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  
  city: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  
  state: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  
  pincode: {
    type: DataTypes.STRING(6),
    allowNull: false,
    validate: {
      is: {
        args: /^\d{6}$/,
        msg: 'Please enter a valid 6-digit pincode'
      }
    }
  },
  
  // Status
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'Shop',
  tableName: 'shops'
});

module.exports = Shop;
