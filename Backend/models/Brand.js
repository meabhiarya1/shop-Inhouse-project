const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Brand extends Model {}

Brand.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  brand_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Brand name is required' }
    }
  }
}, {
  sequelize,
  modelName: 'Brand',
  tableName: 'brands'
});

module.exports = Brand;
